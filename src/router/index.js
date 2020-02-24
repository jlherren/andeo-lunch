import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Calendar from '../views/Calendar.vue'
import Menus from '../views/Menus.vue'
import Cash from '../views/Cash.vue'
import MenuDetail from '../views/MenuDetail.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/menus',
    name: 'Menus',
    component: Menus
  },
  {
    path: '/cash',
    name: 'Cash',
    component: Cash
  },
  {
    path: '/menus/:id',
    name: 'MenuDetail',
    component: MenuDetail
  },

];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router
