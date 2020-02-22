import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Calendar from '../views/Calendar.vue'
import Menus from '../views/Menus.vue'
import Cash from '../views/Cash.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/Calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/Menus',
    name: 'Menus',
    component: Menus
  },
  {
    path: '/Cash',
    name: 'Cash',
    component: Cash
  },

];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router
