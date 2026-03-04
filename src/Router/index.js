import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/AuthStore';

import Home from '../Pages/Home.vue';
import Products from '../Pages/Products.vue';
import Category from '../Pages/Category.vue';
import Cart from '../Pages/Cart.vue';
import WishList from '../Pages/WishList.vue';
import ProductDetails from '../Pages/ProductDetails.vue';
import CategoryProduct from '../components/Category/CategoryProduct.vue';
import ProfilePage from '../Pages/ProfilePage.vue';

//Admins Pages
import AdminDashboard from '../Pages/Admin/AdminDashboard.vue';
import AdminProduct from '../Pages/Admin/AdminProduct.vue';
import AdminOrder from '../Pages/Admin/AdminOrders.vue';
import AdminUser from '../Pages/Admin/AdminUser.vue';
import AdminManger from '../Pages/Admin/AdminManger.vue';

//Auth Pages
import AdminLogin from '../Pages/Admin/AdminLogin.vue';
import Login from '../Pages/Login.vue';
import SignUp from '../Pages/SignUp.vue';

import User from '../layout/User.vue';
import Admin from '../layout/Admin.vue';
import Auth from '../layout/Auth.vue';

const routes = [
  {
    path: '/',
    component: User,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'products', name: 'Products', component: Products },
      {
        path: 'product/:id',
        name: 'ProductDetails',
        component: ProductDetails,
      },
      { path: 'category', name: 'Category', component: Category },
      {
        path: 'cart',
        name: 'Cart',
        component: Cart,
      },
      {
        path: 'wishList',
        name: 'WishList',
        component: WishList,
      },
      {
        path: 'category/:category',
        name: 'CategoryProducts',
        component: CategoryProduct,
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: ProfilePage,
      },
    ],
  },

  //admin Pages/Routes:
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true, isAdmin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'products', name: 'AdminProduct', component: AdminProduct },
      { path: 'orders', name: 'AdminOrder', component: AdminOrder },
      { path: 'users', name: 'AdminUser', component: AdminUser },
      { path: 'manager', name: 'AdminManager', component: AdminManger },
    ],
  },

  //Auth Pages/Routes:
  {
    path: '/auth',
    component: Auth,
    children: [
      { path: 'adminLogin', name: 'AdminLogin', component: AdminLogin },
      { path: 'login', name: 'UserLogin', component: Login },
      { path: 'signUp', name: 'UserSignup', component: SignUp },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.isAdmin) {
    if (!authStore.isAuthenticated) return next({ name: 'AdminLogin' });

    if (!authStore.isAdmin) return next({ name: 'Home' });
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'UserLogin' });
  }

  const isAuthRoute =
    to.name === 'UserLogin' ||
    to.name === 'UserSignup' ||
    to.name === 'AdminLogin';
  if (authStore.isAuthenticated && isAuthRoute) {
    return next(
      authStore.isAdmin ? { name: 'AdminDashboard' } : { name: 'Home' }
    );
  }

  next();
});
export default router;
