import AuditLog from '@/views/AuditLog';
import Calendar from '@/views/Calendar.vue';
import EventDetail from '@/views/event/EventDetail';
import History from '@/views/History.vue';
import Home from '@/views/Home.vue';
import Menus from '@/views/Menus.vue';
import Preferences from '@/views/Preferences';
import Profile from '@/views/Profile';
import Stats from '@/views/Stats';
import TransferList from '@/views/TransfersList.vue';
import TransferWizard from '@/views/TransferWizard';
import TransferWizardCustom from '@/views/TransferWizardCustom';
import TransferWizardFine from '@/views/TransferWizardFine';
import TransferWizardLunch from '@/views/TransferWizardLunch';
import TransferWizardPayUp from '@/views/TransferWizardPayUp';
import TransferWizardSimple from '@/views/TransferWizardSimple';
import TransferWizardTrade from '@/views/TransferWizardTrade';
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
        component: Calendar,
    },
    {
        path:      '/menus',
        component: Menus,
    },
    {
        path:      '/transfers/:date([-0-9]{10})?',
        component: TransferList,
    },
    {
        path:      '/transfers/new',
        component: TransferWizard,
    },
    {
        path:      '/transfers/new/pay-up',
        component: TransferWizardPayUp,
    },
    {
        path:      '/transfers/new/simple',
        component: TransferWizardSimple,
    },
    {
        path:      '/transfers/new/trade',
        component: TransferWizardTrade,
    },
    {
        path:      '/transfers/new/event',
        component: TransferWizardLunch,
    },
    {
        path:      '/transfers/new/fine',
        component: TransferWizardFine,
    },
    {
        path:      '/transfers/new/custom',
        component: TransferWizardCustom,
    },
    {
        path:      '/history',
        component: History,
    },
    {
        path:      '/events/:id(\\d+)',
        component: EventDetail,
    },
    {
        path:      '/profile',
        component: Profile,
    },
    {
        path:      '/preferences',
        component: Preferences,
    },
    {
        path:      '/log',
        component: AuditLog,
    },
    {
        path:      '/stats',
        component: Stats,
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
