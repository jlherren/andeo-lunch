// Exporting this allows values to be set even before Vue has initialized
export let global = {
};

export default {
    install(Vue) {
        global = Vue.observable(global);
        Vue.prototype.$global = global;
    },
};
