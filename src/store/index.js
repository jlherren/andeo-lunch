import Backend from '@/store/backend';
import Cache from '@/store/cache';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

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
        fetchBackendVersion(context) {
            return Cache.ifNotFresh('system', 'version', 60000, async () => {
                context.state.backendVersion = 'unknown';
                let response = await Backend.get('/version');
                context.state.backendVersion = response.data.version;
            });
        },

        // Account
        async login(context, data) {
            let response = await Backend.post('/account/login', data);
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
            let response = await Backend.get('/account/check');
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
        fetchUser(context, {userId}) {
            return Cache.ifNotFresh('user', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}`);
                let user = response.data.user;
                Vue.set(context.state.users, user.id, user);
            });
        },

        // Events
        fetchEvents(context, params) {
            return Cache.ifNotFresh('events', JSON.stringify(params), 10000, async () => {
                let response = await Backend.get('/events', {params});
                for (let event of response.data.events) {
                    event.date = new Date(event.date);
                    Vue.set(context.state.events, event.id, event);
                }
            });
        },

        fetchEvent(context, {eventId}) {
            return Cache.ifNotFresh('event', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}`);
                let event = response.data.event;
                event.date = new Date(event.date);
                Vue.set(context.state.events, event.id, event);
            });
        },

        async fetchParticipations(context, {eventId}) {
            await Cache.ifNotFresh('participations', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/participations`);
                let participations = response.data.participations;
                Vue.set(context.state.participations, eventId, participations);

                for (let participation of participations) {
                    let key = `${eventId}/${participation.userId}`;
                    Cache.validate('participation', key);
                    Vue.set(context.state.singleParticipations, key, participation);
                }
            });

            let promises = context.state.participations[eventId].map(p => context.dispatch('fetchUser', {userId: p.userId}));
            await Promise.all(promises);
        },

        async fetchSingleParticipation(context, {eventId, userId}) {
            let key = `${eventId}/${userId}`;
            await Cache.ifNotFresh('participation', key, 10000, async () => {
                // Don't show an error if there is no participation
                let config = {
                    validateStatus: status => status >= 200 && status < 300 || status === 404,
                };
                let response = await Backend.get(`/events/${eventId}/participations/${userId}`, config);
                if (response.status === 404) {
                    // Note that negative answers will also be cached
                    return;
                }
                let participation = response.data.participation;
                Vue.set(context.state.singleParticipations, `${eventId}/${userId}`, participation);
            });

            await context.dispatch('fetchUser', {userId});
        },

        async saveParticipation(context, {eventId, userId, ...data}) {
            await Backend.post(`/events/${eventId}/participations/${userId}`, data);
            Cache.invalidate('event', eventId);
            Cache.invalidate('participations', eventId);
            Cache.invalidate('participation', `${eventId}/${userId}`);
            await Promise.all([
                context.dispatch('fetchEvent', {eventId}),
                context.dispatch('fetchParticipations', {eventId}),
            ]);
        },

        async saveEvent(context, data) {
            let url = data.id ? `/events/${data.id}` : '/events';
            let response = await Backend.post(url, {...data, id: undefined});

            if (!data.id) {
                let {location} = response.headers;
                let match = location.match(/^\/events\/(?<id>\d+)$/u);
                if (match) {
                    Cache.invalidate('event', match.groups.id);
                    await context.dispatch('fetchEvent', {eventId: match.groups.id});
                }
            } else {
                Cache.invalidate('event', data.id);
                await context.dispatch('fetchEvent', {eventId: data.id});
            }

            Cache.invalidate('events');
        },

        async deleteEvent(context, {eventId}) {
            let response = await Backend.delete(`/events/${eventId}`);
            if (response.status === 204) {
                delete context.state.events[eventId];
                Cache.invalidate('event', eventId);
                Cache.invalidate('events');
            }
        },

        fetchTransactions(context, {userId}) {
            return Cache.ifNotFresh('transactions', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}/transactions?with=eventName`);
                let transactions = response.data.transactions;
                for (let transaction of transactions) {
                    transaction.date = new Date(transaction.date);
                }
                Vue.set(context.state.transactions, userId, transactions);
            });
        },
    },
});
