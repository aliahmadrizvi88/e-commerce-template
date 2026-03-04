import { defineStore } from 'pinia';

import { useAuthStore } from './AuthStore';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const URL = API_BASE_URL;

export const useCartStore = defineStore('Cart', {
  state: () => ({
    loading: false,
    error: null,
    cart: [],
  }),

  actions: {
    addToCart(product) {
      if (!product || !product.id) {
        return;
      }

      const exists = this.cart.find((item) => item.id === product.id);
      if (exists) {
        exists.quantity += 1;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
    },
    removeFromCart(id) {
      this.cart = this.cart.filter((item) => item.id !== id);
    },
    decreaseItems(id) {
      const item = this.cart.find((item) => item.id === id);
      if (item) {
        if (item.quantity > 1) item.quantity--;
        else {
          this.removeFromCart(id);
        }
      }
    },

    clearCart() {
      this.cart = [];
    },

    async checkOut() {
      this.loading = false;
      this.error = null;

      const authStore = useAuthStore();

      if (!authStore.isAuthenticated) {
        this.error = 'You must be logged...';
        this.loading = false;
        throw new Error('User not authenticated');
      }

      const orderPayload = {
        username: authStore.userProfile.username,
        address: authStore.userProfile.address,
        email: authStore.userProfile.email,
        items: this.cart,
        totalprice: this.totalPrice,
        totalitem: this.totalItems,
        date: new Date().toISOString(),
        status: 'Processing',
      };

      try {
        const response = await axios.post(`${URL}/orders`, orderPayload);

        if (response.data && response.status === 201) {
          this.clearCart();
          return response.data;
        }
      } catch (err) {
        this.error = err.message || 'Checkout failed due to server error.';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    totalItems: (state) =>
      state.cart.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) =>
      state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },
});
