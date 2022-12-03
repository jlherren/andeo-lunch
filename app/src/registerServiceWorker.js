/* eslint-disable no-console */

import {EventService} from '@/services/eventService';
import {register} from 'register-service-worker';

// Disable registering the service worker when running in Cypress, because this causes a lot of issues, where old
// version of the app will be tested instead of the current one.  Also see:
// https://github.com/cypress-io/cypress/issues/702

if (process.env.NODE_ENV === 'production' && !window.Cypress) {
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
