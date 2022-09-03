import '@/registerServiceWorker';
import {PiniaVuePlugin, createPinia} from 'pinia';
import App from '@/App.vue';
import GlobalPlugin from '@/plugins/global';
import IconPlugin from '@/plugins/icons';
import StorePlugin from '@/plugins/store';
import Vue from 'vue';
import router from '@/router';
import vuetify from '@/plugins/vuetify';

Vue.config.productionTip = false;

Vue.use(IconPlugin);
Vue.use(GlobalPlugin);
Vue.use(PiniaVuePlugin);
Vue.use(StorePlugin);

let pinia = createPinia();

new Vue({
    router,
    pinia,
    vuetify,
    render: h => h(App),
}).$mount('#app');
