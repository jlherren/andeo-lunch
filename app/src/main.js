import '@/registerServiceWorker';
import App from '@/App.vue';
import Vue from 'vue';
import global from '@/plugins/global';
import icons from '@/plugins/icons';
import router from '@/router';
import store from '@/store';
import vuetify from '@/plugins/vuetify';

Vue.config.productionTip = false;

Vue.use(icons);
Vue.use(global);

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App),
}).$mount('#app');
