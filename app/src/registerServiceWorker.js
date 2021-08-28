/* eslint-disable no-console */

import {EventService} from '@/services/eventService';
import {global} from '@/plugins/global';
import {register} from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
    register(`${process.env.BASE_URL}service-worker.js`, {
        ready() {
            console.log('App is being served from cache by a service worker.');
        },

        registered() {
            console.log('Service worker has been registered.');
        },

        cached() {
            console.log('Content has been cached for offline use.');
        },

        updatefound() {
            console.log('New content is downloading.');
        },

        updated() {
            // See https://stackoverflow.com/questions/54145735/vue-pwa-not-getting-new-content-after-refresh
            global.hasUpdate = true;
        },

        offline() {
            console.log('No internet connection found. App is running in offline mode.');
            EventService.systemMessage.dispatch('No internet connection');
        },

        error(error) {
            console.error('Error during service worker registration:', error);
            EventService.systemMessage.dispatch('Error registering service worker');
        },
    });
}
