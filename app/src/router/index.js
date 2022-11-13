import Home from '@/views/Home.vue';
import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path:      '/',
        component: Home,
    },
    {
        path:      '/calendar/:date([-0-9]{10})?',
        component: () => import('@/views/Calendar.vue'),
    },
    {
        path:      '/menus',
        component: () => import('@/views/Menus.vue'),
    },
    {
        path:      '/transfers/:date([0-9]{4}-[0-9]{2}-[0-9]{2})?',
        component: () => import('@/views/TransfersList.vue'),
    },
    {
        path:      '/transfers/:id(\\d+)',
        component: () => import('@/views/event/TransferDetail'),
    },
    {
        path:      '/transfers/new',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizard'),
    },
    {
        path:      '/transfers/new/pay-up',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardPayUp'),
    },
    {
        path:      '/transfers/new/simple',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardSimple'),
    },
    {
        path:      '/transfers/new/trade',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardTrade'),
    },
    {
        path:      '/transfers/new/expense',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardExpense'),
    },
    {
        path:      '/transfers/new/fine',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardFine'),
    },
    {
        path:      '/transfers/new/custom',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/TransferWizardCustom'),
    },
    {
        path:      '/history',
        component: () => import('@/views/History.vue'),
    },
    {
        path:      '/events/:id(\\d+)',
        component: () => import('@/views/event/EventDetail'),
    },
    {
        path:      '/events/:id(\\d+)/edit',
        component: () => import('@/views/event/EventEdit'),
    },
    {
        path:      '/events/new',
        component: () => import('@/views/event/EventEdit'),
    },
    {
        path:      '/events/help',
        component: () => import('@/views/event/EventHelp'),
    },
    {
        path:      '/account',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/settings/AccountSettings'),
    },
    {
        path:      '/account/password',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/settings/ChangePassword'),
    },
    {
        path:      '/preferences',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/settings/Preferences'),
    },
    {
        path:      '/preferences/default-opt-in',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/settings/DefaultOptIn'),
    },
    {
        path:      '/preferences/absences',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/settings/Absences'),
    },
    {
        path:      '/log',
        component: () => import('@/views/AuditLog'),
    },
    {
        path:      '/stats',
        component: () => import('@/views/Stats'),
    },
    {
        path:      '/about',
        component: () => import('@/views/settings/About'),
    },
    {
        path:      '/grocery-list',
        component: () => import('@/views/GroceryList'),
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
