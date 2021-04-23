import Vue from 'vue';
import Vuex from 'vuex';
import Vapi from 'vuex-rest-api';
import Axios from 'axios';

Vue.use(Vuex);

let axios = Axios.create();
axios.interceptors.request.use(config => {
    let token = localStorage.getItem('token');
    // TODO: Validate the token locally before sending it?
    if (token !== null) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const vapi = new Vapi({
    axios,
    baseURL: 'http://localhost:3000',
    state:   {
        backendVersion: 'unknown',
        frontendVersion: 'unknown',

        account: {
            initialCheckCompleted: false,
            error:                 null,
            user:                  null,
        },

        // To be deprecated:
        user:    {
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
                helpers: [
                    {
                        firstName: 'Michael',
                        lastName: 'Kunst',
                        points: 4
                    },
                    {
                        firstName: 'Jean-Luc',
                        lastName: 'Herren',
                        points: 4
                    },

                ]
            },
            {
                id: 10,
                name: 'Pastaplausch',
                date: '24.02.20',
                weekday: 'Monday',
                isToday: false,
                participants: {
                    meat: 9,
                    vegi: 3
                }
            },
            {
                id: 11,
                name: 'Griechischer Salat',
                date: '25.02.20',
                weekday: 'Tuesday',
                isToday: false,
                participants: {
                    meat: 9,
                    vegi: 3
                }
            },
            {
                id: 12,
                name: 'Pizza',
                date: '26.02.20',
                weekday: 'Wednesday',
                isToday: false,
                participants: {
                    meat: 9,
                    vegi: 3
                }
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
        ]
    },
});

vapi.get({
    action: 'updateBackendVersion',
    path:   '/version',
    property: 'backendVersion',
    onSuccess(state, payload) {
        state.backendVersion = payload.data.version;
    },
    onError(state, error) {
        state.backendVersion = 'unknown';
    },
});

vapi.post({
    action: 'login',
    path:   '/account/login',
    beforeRequest(state, {params, data}) {
        state.account.error = null;
    },
    onSuccess(state, payload) {
        localStorage.setItem('token', payload.data.token);
        state.account.error = null;
    },
    onError(state, error) {
        if (error.response && error.response.status === 401) {
            state.account.error = error.response.data;
            return;
        }
        state.account.error = error.message;
    },
});

vapi.get({
    action: 'checkLogin',
    path:   '/account/check',
    onSuccess(state, payload) {
        state.account.initialCheckCompleted = true;
        if (payload.data.loggedIn) {
            state.account.user = payload.data.user;
        }
        else {
            state.account.user = null;
        }
    },
    onError(state, error) {
        state.account.initialCheckCompleted = true;
        state.account.user = null;
        state.account.error = error;
    },
});

vapi.get({
    action: 'updateEvents',
    path:   '/events',
    queryParams: true,
    onSuccess(state, payload) {
        for (let event of payload.data.events) {
            event.date = new Date(event.date);
            Vue.set(state.events, event.id, event);
        }
    },
});

let store = vapi.getStore();

store.getters = {
    ...store.getters,
    getUser(state) {
        return state.account.user;
    },
    getDisplayName(state) {
        return state.account.user.name;
    },
    getUsername(state) {
        return state.account.user.username;
    },
    getPoints(state) {
        return state.account.user.balances.points;
    },
    getMoney(state) {
        return state.account.user.balances.money;
    },
    isLoggedIn(state) {
        return state.account.user !== null;
    },
    getMenus(state) {
        return state.menus;
    },
    getMenuById: (state) => (id) => {
        return state.menus.find(menu => menu.id === id);
    },
    getSettings(state) {
        return state.user.settings;
    },
    getFrontendVersion(state) {
        return state.frontendVersion;
    },
    getBackendVersion(state) {
        return state.backendVersion;
    },
    getEvents(state) {
        return Object.values(state.events);
    }
};

store.mutations = {
    ...store.mutations,
    updateSettings(state, newSettings) {
        state.account.user.settings = newSettings;
    },
    removeUser(state) {
        state.account.user = null;
    },
};

store.actions = {
    ...store.actions,

    logout(context) {
        localStorage.removeItem('token');
        context.commit('removeUser');
    }
};

export default new Vuex.Store(store);
