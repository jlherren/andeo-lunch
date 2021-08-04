import AuditLog from '@/views/AuditLog';
import Calendar from '@/views/Calendar.vue';
import History from '@/views/History.vue';
import Home from '@/views/Home.vue';
import LunchDetail from '@/views/LunchDetail';
import Menus from '@/views/Menus.vue';
import Preferences from '@/views/Preferences';
import Stats from '@/views/Stats';
import Transfer from '@/views/Transfer.vue';
import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path:      '/',
        name:      'Home',
        component: Home,
    },
    {
        path:      '/calendar/:date([-0-9]{10})?',
        name:      'Calendar',
        component: Calendar,
    },
    {
        path:      '/menus',
        name:      'Menus',
        component: Menus,
    },
    {
        path:      '/transfer',
        name:      'Transfer',
        component: Transfer,
    },
    {
        path:      '/history',
        name:      'History',
        component: History,
    },
    {
        path:      '/events/:id(\\d+)',
        name:      'LunchDetail',
        component: LunchDetail,
    },
    {
        path:      '/preferences',
        name:      'Preferences',
        component: Preferences,
    },
    {
        path:      '/log',
        name:      'Audit log',
        component: AuditLog,
    },
    {
        path:      '/stats',
        name:      'Stats',
        component: Stats,
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
