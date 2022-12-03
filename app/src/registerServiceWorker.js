/* eslint-disable no-console */

import {EventService} from '@/services/eventService';
import {register} from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
    register(`${process.env.BASE_URL}service-worker.js`, {
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
