import {useStore} from '@/store';

export default {
    install(Vue) {
        Vue.prototype.$store = useStore;
    },
};
