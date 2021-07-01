/* eslint-disable no-console */

import {UpdateService} from '@/services/updateService';
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
            if (UpdateService.instance.onUpdate()) {
                console.log('New content is available, notified update handler');
            } else {
                console.log('New content is available, no update handler available, refreshing app');
                window.location.reload();
            }
        },
        offline() {
            console.log('No internet connection found. App is running in offline mode.');
        },
        error(error) {
            console.error('Error during service worker registration:', error);
        },
    });
}
