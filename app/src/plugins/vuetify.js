import {ANDEO_BLUE} from '@/constants';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    icons: {
        iconfont: 'mdiSvg',
    },
    theme: {
        themes:  {
            light: {
                primary: ANDEO_BLUE,
            },
            dark:  {
                primary: ANDEO_BLUE,
            },
        },
        options: {
            variations: false,
        },
    },
});
