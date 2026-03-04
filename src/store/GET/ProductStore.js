import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: [],
    productDetails: null,
    error: null,
    errors: null,
    loading: false,
  }),

  actions: {
    setError(message) {
      this.error = message;
      this.errors = message;
    },

    clearError() {
      this.error = null;
      this.errors = null;
    },

    async fetchProduct() {
      this.loading = true;
      this.clearError();

      try {
        const response = await axios.get(`${API_BASE_URL}/products`);

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected products response format.');
        }

        this.products = response.data;
      } catch (err) {
        this.setError(err.message || 'Failed to load products.');
      } finally {
        this.loading = false;
      }
    },

    //Fetch Product Details
    async fetchProductDetails(id) {
      this.loading = true;
      this.clearError();
      this.productDetails = null;

      try {
        const localProduct = this.products.find(
          (p) => String(p.id) === String(id)
        );

        if (localProduct) {
          this.productDetails = localProduct;
        } else {
          const response = await axios.get(`${API_BASE_URL}/products/${id}`);
          this.productDetails = response.data;
        }
      } catch (err) {
        this.setError('Failed to load product details.');
      } finally {
        this.loading = false;
      }
    },

    //Add New Product
    async addProduct(newProduct) {
      this.loading = true;
      this.clearError();

      const productPayload = {
        ...newProduct,
        rating: { rate: 0, count: 0 },
      };

      try {
        const response = await axios.post(
          `${API_BASE_URL}/products`,
          productPayload
        );
        const productWithId = response.data;
        this.products.push(productWithId);
      } catch (err) {
        this.setError('Failed to add product.');
      } finally {
        this.loading = false;
      }
    },

    //Edit Existing Product:
    async editProduct(updatedProduct) {
      this.loading = true;
      this.clearError();

      try {
        const response = await axios.patch(
          `${API_BASE_URL}/products/${updatedProduct.id}`,
          updatedProduct
        );

        const savedProduct = response.data;

        const index = this.products.findIndex((p) => p.id === savedProduct.id);

        if (index !== -1) {
          this.products[index] = savedProduct;
        }
      } catch (err) {
        this.setError(err.message || 'Failed to update product.');
      } finally {
        this.loading = false;
      }
    },

    //deleteProducts
    async deleteProduct(id) {
      this.loading = true;
      this.clearError();

      try {
        await axios.delete(`${API_BASE_URL}/products/${id}`);

        this.products = this.products.filter((item) => item.id !== id);
      } catch (err) {
        this.setError('Failed to delete product.');
      } finally {
        this.loading = false;
      }
    },
  },
});
