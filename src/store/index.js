import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import {ErrorService} from '@/services/errorService';

Vue.use(Vuex);

const BASE_URL = 'http://localhost:4000';

let axios = Axios.create();

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
        return await axios.get(BASE_URL + url, config);
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
        return await axios.post(BASE_URL + url, data, config);
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
        return await axios.delete(BASE_URL + url, config);
    } catch (err) {
        processError(err);
        ErrorService.instance.onError(err);
        throw err;
    }
}

export default new Vuex.Store({
    state: {
        backendVersion:  'unknown',
        frontendVersion: 'unknown',

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

        // To be deprecated
        menus: [
            {
                id:           5,
                name:         'Russischer Salat',
                date:         '23.02.20',
                weekday:      'Friday',
                isToday:      true,
                participants: {
                    meat: 9,
                    vegi: 3,
                },
                helpers:      [
                    {
                        firstName: 'Michael',
                        lastName:  'Kunst',
                        points:    4,
                    },
                    {
                        firstName: 'Jean-Luc',
                        lastName:  'Herren',
                        points:    4,
                    },

                ],
            },
            {
                id:           10,
                name:         'Pastaplausch',
                date:         '24.02.20',
                weekday:      'Monday',
                isToday:      false,
                participants: {
                    meat: 9,
                    vegi: 3,
                },
            },
            {
                id:           11,
                name:         'Griechischer Salat',
                date:         '25.02.20',
                weekday:      'Tuesday',
                isToday:      false,
                participants: {
                    meat: 9,
                    vegi: 3,
                },
            },
            {
                id:           12,
                name:         'Pizza',
                date:         '26.02.20',
                weekday:      'Wednesday',
                isToday:      false,
                participants: {
                    meat: 9,
                    vegi: 3,
                },
            },
            {
                id:           13,
                name:         'Sandwich Action',
                date:         '27.02.20',
                weekday:      'Thursday',
                isToday:      false,
                participants: {
                    meat: 9,
                    vegi: 3,
                },
            },
        ],
    },

    getters: {
        // System information
        frontendVersion: state => state.frontendVersion,
        backendVersion:  state => state.backendVersion,

        // Users and account
        user: state => id => state.users[id],

        // Own user
        isLoggedIn: state => state.account.userId !== null,
        ownUserId:  state => state.account.userId,
        ownUser:    (state, getters) => getters.user(getters.ownUserId),
        settings:   state => state.user.settings,

        // Events
        events:         state => Object.values(state.events),
        event:          state => id => state.events[id],
        participations: state => id => state.participations[id],

        // Legacy
        menus(state) {
            return state.menus;
        },
        menuById: (state) => (id) => {
            return state.menus.find(menu => menu.id === id);
        },
    },

    mutations: {
        updateSettings(state, newSettings) {
            state.account.user.settings = newSettings;
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
        },

        async fetchParticipations(context, {eventId}) {
            let response = await get(`/events/${eventId}/participations`);
            let participations = response.data.participations;
            Vue.set(context.state.participations, eventId, participations);

            let promises = participations.map(p => context.dispatch('fetchUser', {userId: p.userId}));
            await Promise.all(promises);
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
    },
});
