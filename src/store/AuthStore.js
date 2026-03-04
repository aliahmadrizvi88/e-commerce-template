import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const URL = API_BASE_URL;

const loadProfile = (type) => {
  if (!type) return null;
  const key = type === 'admin' ? 'adminProfile' : 'clientProfile';
  try {
    return JSON.parse(sessionStorage.getItem(key)) || null;
  } catch (error) {
    sessionStorage.removeItem(key);
    return null;
  }
};

const generateUsername = (credentials) => {
  const namePart = credentials.firstname + credentials.lastname;
  const length = namePart.length;
  return `${namePart.toLowerCase()}${length}`;
};

const createNewUser = (credentials) => ({
  email: credentials.email,
  username: generateUsername(credentials),
  password: credentials.password,
  name: { firstname: credentials.firstname, lastname: credentials.lastname },
  phone: 'yet needed to add',
  address: {
    geolocation: { lat: '0', long: '0' },
    city: 'yet needed to add',
    street: 'yet needed to add',
    number: 0,
    zipcode: 'yet needed to add',
  },
  __v: 0,
});

export const useAuthStore = defineStore('auth', {
  state: () => {
    const userType = sessionStorage.getItem('userType') || null;
    const token = sessionStorage.getItem('token') || null;

    return {
      clientProfile: userType === 'user' ? loadProfile('user') : null,
      adminProfile: userType === 'admin' ? loadProfile('admin') : null,

      token: token,
      userType: userType,

      loading: false,
      error: null,
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.userType === 'admin',

    userProfile: (state) => {
      return state.isAdmin ? state.adminProfile : state.clientProfile;
    },
  },

  actions: {
    _handleSuccessfulLogin(foundUser, type) {
      const mockToken = `fake-jwt-${foundUser.id}-${type}-${Date.now()}`;
      sessionStorage.setItem('token', mockToken);
      this.token = mockToken;

      sessionStorage.setItem('userType', type);
      this.userType = type;

      const profileData = {
        email: foundUser.email,
        username: foundUser.username,
        name: foundUser.name,
        phone: foundUser.phone || null,
        address: foundUser.address || null,
        id: foundUser.id,
        mustChangePassword: foundUser.mustChangePassword,
      };

      const storageKey = type === 'admin' ? 'adminProfile' : 'clientProfile';

      this.clientProfile = null;
      this.adminProfile = null;

      if (type === 'user') {
        this.clientProfile = profileData;
      } else if (type === 'admin') {
        this.adminProfile = profileData;
      }

      sessionStorage.setItem(storageKey, JSON.stringify(profileData));
    },

    async registerUser(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const checkEmail = await axios.get(
          `${URL}/users?email=${credentials.email}`
        );
        if (checkEmail.data.length > 0) {
          throw new Error('Email is already registered');
        }

        const newUser = createNewUser(credentials);
        const response = await axios.post(`${URL}/users`, newUser);

        if (response.data && response.status === 201) {
          this._handleSuccessfulLogin(response.data, 'user');
          return response.data;
        } else {
          throw new Error('Server failed to create user record.');
        }
      } catch (err) {
        this.error = err.message || 'Registration failed.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async UserLogin(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${URL}/users?email=${credentials.email}&password=${credentials.password}`
        );
        if (response.data.length > 0) {
          this._handleSuccessfulLogin(response.data[0], 'user');
        } else {
          throw new Error('Invalid user credentials.');
        }
      } catch (err) {
        this.error = err.message || 'User login failed.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateUserDetails(updatedPayload) {
      this.loading = true;
      this.error = null;

      if (!this.isAuthenticated || this.isAdmin) {
        this.error = 'Action limited to authenticated clients.';
        this.loading = false;
        throw new Error(this.error);
      }

      const userId = this.userProfile.id;
      let fullCurrentUser;

      try {
        const fetchResponse = await axios.get(`${URL}/users/${userId}`);
        fullCurrentUser = fetchResponse.data;
      } catch (fetchError) {
        this.error = 'Could not fetch current user data for update.';
        this.loading = false;
        throw fetchError;
      }

      const finalUpdateObject = {
        id: fullCurrentUser.id,
        email: fullCurrentUser.email,
        password: fullCurrentUser.password,
        username: updatedPayload.username,
        name: updatedPayload.name,
        phone: updatedPayload.phone,
        address: updatedPayload.address,
        __v: fullCurrentUser.__v || 0,
      };

      try {
        const response = await axios.put(
          `${URL}/users/${userId}`,
          finalUpdateObject
        );
        if (response.data) {
          this._handleSuccessfulLogin(response.data, this.userType);
        }
      } catch (err) {
        this.error = err.message || 'Failed to update user details on server.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async ChangeUserPassword({ oldPassword, newPassword, newConfirmPassword }) {
      this.loading = true;
      this.error = null;

      if (newPassword !== newConfirmPassword) {
        this.error = 'New password do not match.';
        this.loading = false;
        throw new Error(this.error);
      }

      const userId = this.userProfile.id;
      const endpoint = this.isAdmin
        ? `${URL}/admin/${userId}`
        : `${URL}/users/${userId}`;

      try {
        const userResponse = await axios.get(endpoint);
        const currentUser = userResponse.data;

        if (currentUser.password !== oldPassword) {
          throw new Error('Incorrect Old Password');
        }

        const newPasswordPayload = {
          password: newPassword,
          mustChangePassword: false,
        };

        const patchResponse = await axios.patch(endpoint, newPasswordPayload);

        if (patchResponse.data) {
          this._handleSuccessfulLogin(patchResponse.data, this.userType);
        }

        console.log(
          `Password and 'mustChangePassword' flag updated successfully.`
        );
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to update password.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteAccount() {
      this.loading = true;
      this.error = null;

      const userId = this.userProfile.id;

      try {
        await axios.delete(`${URL}/users/${userId}`);
        this.logout();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userType');

      sessionStorage.removeItem('clientProfile');
      sessionStorage.removeItem('adminProfile');

      this.token = null;
      this.userType = null;
      this.clientProfile = null;
      this.adminProfile = null;
    },
  },
});
