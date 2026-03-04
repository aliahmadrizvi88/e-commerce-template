import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';

export const useCategoryStore = defineStore('CategoryStore', {
  state: () => ({
    category: [],
    productByCategory: [],
    errors: null,
    loading: false,
  }),

  actions: {
    async fetchCategory() {
      this.loading = true;
      this.errors = null;

      try {
        const response = await axios.get(`${API_BASE_URL}/products`);

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected categories response format.');
        }

        this.category = [
          ...new Set(response.data.map((product) => product?.category)),
        ].filter(Boolean);
      } catch (err) {
        this.errors = err.message || 'Failed to load categories.';
      } finally {
        this.loading = false;
      }
    },

    async fetchProductByCategory(endpoint) {
      this.loading = true;
      this.errors = null;
      this.productByCategory = [];

      try {
        const categoryName = decodeURIComponent(endpoint);
        const response = await axios.get(`${API_BASE_URL}/products`, {
          params: { category: categoryName },
        });

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected products response format.');
        }

        this.productByCategory = response.data.filter(
          (product) => product?.category === categoryName
        );
      } catch (err) {
        this.errors =
          err.message || 'Failed to load products for this category.';
      } finally {
        this.loading = false;
      }
    },
  },
});
