import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import {ErrorService} from '@/services/errorService';
import {setupCache} from 'axios-cache-adapter';
import {serializeQuery} from 'axios-cache-adapter/src/cache';

Vue.use(Vuex);

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL;

if (BACKEND_URL === undefined) {
    throw new Error('Missing backend URL, please create a .env.local file!');
}

const cache = setupCache({
    maxAge:  15 * 1000,
    exclude: {
        query: false,
    },
    key(req) {
        // For weird reasons, the default also serializes the post data, cause a POST to an url to not invalidate
        // the GET for the same URL
        return req.url + serializeQuery(req);
    },
});

let axios = Axios.create({
    adapter: cache.adapter,
});

/**
 * @param {object} config
 */
function addAuthorizationHeader(config) {
    let token = localStorage.getItem('token');
    // TODO: Validate the token locally before sending it?
    if (token !== null) {
        config.headers ??= {};
        config.headers.Authorization = `Bearer ${token}`;
    }
}

/**
 * Process an Axios thrown error to contain a better error message
 * @param {Error} error
 */
function processError(error) {
    let message = error?.response?.data;
    if (message) {
        // These error statuses are known to contain meaningful messages in the body
        error.message = message;
    }
}

/**
 * Send an authenticated (if possible) GET request
 *
 * @param {string} url
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function get(url, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.get(BACKEND_URL + url, config);
    } catch (err) {
        processError(err);
        ErrorService.instance.onError(err);
        throw err;
    }
}

/**
 * Send an authenticated (if possible) POST request
 *
 * @param {string} url
 * @param {object} data
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function post(url, data, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.post(BACKEND_URL + url, data, config);
    } catch (err) {
        processError(err);
        ErrorService.instance.onError(err);
        throw err;
    }
}

/**
 * Send an authenticated (if possible) DELETE request
 *
 * @param {string} url
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function delete_(url, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.delete(BACKEND_URL + url, config);
    } catch (err) {
        processError(err);
        ErrorService.instance.onError(err);
        throw err;
    }
}

export default new Vuex.Store({
    state: {
        globalSnackbar: null,

        backendVersion:  'unknown',
        frontendVersion: process.env.VUE_APP_VERSION,

        account: {
            initialCheckCompleted: false,
            userId:                null,
        },

        // To be deprecated:
        user: {
            displayName: 'Oliver Wiedemann',
            points:      7.52,
            money:       -218.15,
            settings:    {
                weekdays:     {
                    monday:    true,
                    tuesday:   true,
                    wednesday: true,
                    thursday:  false,
                    friday:    false,
                },
                isVegetarian: false,
                generalInfo:  null,
            },
        },

        users: {
            // Users by ID
        },

        events: {
            // Events by ID
        },

        participations: {
            // Participations by event ID
        },

        singleParticipations: {
            // Single participations by event ID and user ID.  Key format `${eventId}/${userId}`
        },

        transactions: {
            // Transactions by user ID

            // TODO: Unload these again when not needed?  How to handle very old history to avoid memory pressure?
        },
    },

    getters: {
        // System information
        frontendVersion: state => state.frontendVersion,
        backendVersion:  state => state.backendVersion,

        // Users and account
        user: state => userId => state.users[userId],

        // Own user
        isLoggedIn: state => state.account.userId !== null,
        ownUserId:  state => state.account.userId,
        ownUser:    (state, getters) => getters.user(getters.ownUserId),
        settings:   state => state.user.settings,

        // Events
        events:         state => Object.values(state.events),
        event:          state => eventId => state.events[eventId],
        participations: state => eventId => state.participations[eventId],
        participation:  state => (eventId, userId) => state.singleParticipations[`${eventId}/${userId}`],

        // Transactions
        transactions: state => userId => state.transactions[userId],

        globalSnackbar: state => state.globalSnackbar,
    },

    mutations: {
        updateSettings(state, newSettings) {
            state.account.user.settings = newSettings;
        },

        globalSnackbar(state, text) {
            state.globalSnackbar = text;
        },
    },

    actions: {
        // System information
        async fetchBackendVersion(context) {
            context.state.backendVersion = 'unknown';
            let response = await get('/version');
            context.state.backendVersion = response.data.version;
        },

        // Account
        async login(context, data) {
            let response = await post('/account/login', data);
            localStorage.setItem('token', response.data.token);
            context.state.account.userId = response.data.userId;
            await context.dispatch('fetchUser', {userId: response.data.userId});
        },

        logout(context) {
            localStorage.removeItem('token');
            context.state.account.userId = null;
            context.commit('globalSnackbar', 'You have been logged out');
        },

        async checkLogin(context) {
            let response = await get('/account/check');
            let userId = response.data.userId;

            if (userId !== null) {
                context.state.account.userId = userId;
                await context.dispatch('fetchUser', {userId});
            } else {
                context.state.account.userId = null;
            }

            context.state.account.initialCheckCompleted = true;
        },

        // Users
        async fetchUser(context, {userId}) {
            let response = await get(`/users/${userId}`);
            let user = response.data.user;
            Vue.set(context.state.users, user.id, user);
        },

        // Events
        async fetchEvents(context, params) {
            let response = await get('/events', {params});
            for (let event of response.data.events) {
                event.date = new Date(event.date);
                Vue.set(context.state.events, event.id, event);
            }
        },

        async fetchEvent(context, {eventId}) {
            let response = await get(`/events/${eventId}`);
            let event = response.data.event;
            event.date = new Date(event.date);
            Vue.set(context.state.events, event.id, event);
            return event;
        },

        async fetchParticipations(context, {eventId}) {
            let response = await get(`/events/${eventId}/participations`);
            let participations = response.data.participations;
            Vue.set(context.state.participations, eventId, participations);

            for (let participation of participations) {
                Vue.set(context.state.singleParticipations, `${eventId}/${participation.userId}`, participation);
            }

            let promises = participations.map(p => context.dispatch('fetchUser', {userId: p.userId}));
            await Promise.all(promises);
        },

        async fetchSingleParticipation(context, {eventId, userId}) {
            // Don't show an error if there is no participation
            let config = {validateStatus: status => status >= 200 && status < 300 || status === 404};
            let response = await get(`/events/${eventId}/participations/${userId}`, config);
            if (response.status === 404) {
                return null;
            }
            let participation = response.data.participation;
            Vue.set(context.state.singleParticipations, `${eventId}/${userId}`, participation);
            await context.dispatch('fetchUser', {userId});
        },

        async saveParticipation(context, {eventId, userId, ...data}) {
            await post(`/events/${eventId}/participations/${userId}`, data);
            await Promise.all([
                context.dispatch('fetchEvent', {eventId}),
                context.dispatch('fetchParticipations', {eventId}),
            ]);
        },

        async saveEvent(context, data) {
            let url = data.id ? `/events/${data.id}` : '/events';
            let response = await post(url, {...data, id: undefined});

            if (!data.id) {
                let {location} = response.headers;
                let match = location.match(/^\/events\/(\d+)$/);
                if (match) {
                    await context.dispatch('fetchEvent', {eventId: match[1]});
                }
            } else {
                await context.dispatch('fetchEvent', {eventId: data.id});
            }
        },

        async deleteEvent(context, {eventId}) {
            let response = await delete_(`/events/${eventId}`);
            if (response.status === 204) {
                delete context.state.events[eventId];
            }
        },

        async fetchTransactions(context, {userId}) {
            let response = await get(`/users/${userId}/transactions?with=eventName`);
            let transactions = response.data.transactions;
            for (let transactions of transactions) {
                transactions.date = new Date(transactions.date);
            }
            Vue.set(context.state.transactions, userId, transactions);
        },
    },
});
