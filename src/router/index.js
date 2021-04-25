import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/Home.vue';
import Calendar from '@/views/Calendar.vue';
import Menus from '@/views/Menus.vue';
import Cash from '@/views/Cash.vue';
import EventDetail from '@/views/EventDetail';

Vue.use(VueRouter);

const routes = [
    {
        path:      '/',
        name:      'Home',
        component: Home,
    },
    {
        path:      '/calendar',
        name:      'Calendar',
        component: Calendar,
    },
    {
        path:      '/menus',
        name:      'Menus',
        component: Menus,
    },
    {
        path:      '/cash',
        name:      'Cash',
        component: Cash,
    },
    {
        path:      '/events/:id',
        name:      'EventDetail',
        component: EventDetail,
    },

];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
