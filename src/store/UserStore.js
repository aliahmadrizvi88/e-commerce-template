import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const URL = API_BASE_URL;

export const useUserStore = defineStore('userStore', {
  state: () => ({
    users: [],
    error: null,
    loading: false,
  }),

  actions: {
    async fetchUser() {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await axios.get(`${URL}/users`);

        this.users = data.map((user) => ({
          id: user.id,
          name: `${user.name.firstname} ${user.name.lastname}`,
          username: user.username,
          email: user.email,
          phone: user.phone,
          city: user.address.city,
        }));
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(id) {
      this.loading = true;
      this.error = null;

      try {
        await axios.delete(`${URL}/users/${id}`);

        this.users = this.users.filter((item) => item.id !== id);
      } catch (err) {
        this.error = 'Failed to delete User';
      } finally {
        this.loading = false;
      }
    },
  },
});
