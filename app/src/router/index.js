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
        component: () => import('@/views/event/transfer/TransfersList.vue'),
    },
    {
        path:      '/transfers/:id(\\d+)',
        component: () => import('@/views/event/transfer/TransferDetail.vue'),
    },
    {
        path:      '/transfers/new',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizard.vue'),
    },
    {
        path:      '/transfers/new/pay-up',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizardPayUp.vue'),
    },
    {
        path:      '/transfers/new/simple',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizardSimple.vue'),
    },
    {
        path:      '/transfers/new/trade',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizardTrade.vue'),
    },
    {
        path:      '/transfers/new/expense',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizardExpense.vue'),
    },
    {
        path:      '/transfers/new/custom',
        component: () => import(/* webpackChunkName: "wizards" */ '@/views/event/transfer/TransferWizardCustom.vue'),
    },
    {
        path:      '/history/:id(\\d+)',
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
        path:      '/events/:id(\\d+)/grid',
        component: () => import('@/views/event/EventGridEdit'),
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
    {
        path:      '/admin',
        component: () => import('@/views/admin/Admin'),
    },
    {
        path:      '/admin/users',
        component: () => import('@/views/admin/Users'),
    },
    {
        path:      '/admin/users/new',
        component: () => import('@/views/admin/UserCreate'),
    },
    {
        path:      '/admin/users/:id(\\d+)',
        component: () => import('@/views/admin/UserEdit'),
    },
    {
        path:      '/admin/users/:id(\\d+)/password',
        component: () => import('@/views/admin/UserResetPassword'),
    },
    {
        path:      '/tools',
        component: () => import('@/views/tools/Tools'),
    },
    {
        path:      '/tools/ics',
        component: () => import('@/views/tools/IcsCreator'),
    },
    {
        path:      '/tools/device-versions',
        component: () => import('@/views/tools/DeviceVersions'),
    },
    {
        path:      '/tools/configurations',
        component: () => import('@/views/tools/Configurations'),
    },
    {
        path:     '*',
        redirect: '/',
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
