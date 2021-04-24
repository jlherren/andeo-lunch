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
        ErrorService.instance.onError(err);
        throw err;
    }
}

/**
 * Send an authenticated (if possible) GET request
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
        if (err.response && [400, 401].includes(err.response.status)) {
            // These error statuses are known to contain meaningful messages in the body
            err = new Error(err.response.data);
        }
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
            user:                  null,
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

        events: {
            // Events by ID
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
        user(state) {
            return state.account.user;
        },
        displayName(state) {
            return state.account.user.name;
        },
        username(state) {
            return state.account.user.username;
        },
        balances(state) {
            return state.account.user.balances;
        },
        isLoggedIn(state) {
            return state.account.user !== null;
        },
        menus(state) {
            return state.menus;
        },
        menuById: (state) => (id) => {
            return state.menus.find(menu => menu.id === id);
        },
        settings(state) {
            return state.user.settings;
        },
        frontendVersion(state) {
            return state.frontendVersion;
        },
        backendVersion(state) {
            return state.backendVersion;
        },
        events(state) {
            return Object.values(state.events);
        },
    },

    mutations: {
        updateSettings(state, newSettings) {
            state.account.user.settings = newSettings;
        },
    },

    actions: {
        async updateBackendVersion(context) {
            context.state.backendVersion = 'unknown';
            let response = await get('/version');
            context.state.backendVersion = response.data.version;
        },

        async login(context, data) {
            let response = await post('/account/login', data);
            localStorage.setItem('token', response.data.token);
        },

        logout(context) {
            localStorage.removeItem('token');
            context.state.account.user = null;
        },

        async checkLogin(context) {
            let response = await get('/account/check');
            context.state.account.initialCheckCompleted = true;
            if (response.data.loggedIn) {
                context.state.account.user = response.data.user;
            } else {
                context.state.account.user = null;
            }
        },

        async updateEvents(context, params) {
            // queryParams: true,
            let response = await get('/events', {params});
            for (let event of response.data.events) {
                event.date = new Date(event.date);
                Vue.set(context.state.events, event.id, event);
            }
        },

        async saveEvent(context, data) {
            await post('/events', data);
        },
    },
});
