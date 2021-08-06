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
            username:              null,
        },

        users: {
            // Users by ID
        },

        // All user IDs
        allUserIds: [],

        events: {
            // Events by ID
        },

        participations: {
            // Participations by event ID
        },

        singleParticipations: {
            // Single participations by event ID and user ID.  Key format `${eventId}/${userId}`
        },

        transfers: {
            // Transfers by event ID
        },

        transactions: {
            // Transactions by user ID

            // TODO: Unload these again when not needed?  How to handle very old history to avoid memory pressure?
        },

        audits: [],

        settings: {},
    },

    getters: {
        // System information
        frontendVersion: state => state.frontendVersion,
        backendVersion:  state => state.backendVersion,

        // Users and account
        user:  state => userId => state.users[userId],
        users: (state, getters) => state.allUserIds.map(userId => getters.user(userId)),

        // Own user
        isLoggedIn:  state => state.account.userId !== null,
        ownUserId:   state => state.account.userId,
        ownUsername: state => state.account.username,
        ownUser:     (state, getters) => getters.user(getters.ownUserId),

        // Events
        events:         state => Object.values(state.events),
        event:          state => eventId => state.events[eventId],
        participations: state => eventId => state.participations[eventId],
        participation:  state => (eventId, userId) => state.singleParticipations[`${eventId}/${userId}`],
        transfers:      state => eventId => state.transfers[eventId],

        // Transactions
        transactions: state => userId => state.transactions[userId],

        // Misc
        globalSnackbar: state => state.globalSnackbar,
        audits:         state => state.audits,
        settings:       state => state.settings,
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
            await context.dispatch('fetchUser', {userId: response.data.userId});
            // Don't set the following until after the user is fetched, otherwise 'ownUser' won't be reliable
            context.state.account.userId = response.data.userId;
            context.state.account.username = response.data.username;
        },

        logout(context) {
            localStorage.removeItem('token');
            context.state.account.userId = null;
            context.commit('globalSnackbar', 'You have been logged out');
        },

        async checkLogin(context) {
            let response = await Backend.get('/account/check');
            let userId = response.data.userId;

            if (userId) {
                await context.dispatch('fetchUser', {userId});
                // Don't set the following until after the user is fetched, otherwise 'ownUser' won't be reliable
                context.state.account.userId = userId;
                context.state.account.username = response.data.username;
            } else {
                context.state.account.userId = null;
                context.state.account.username = null;
            }

            context.state.account.initialCheckCompleted = true;
        },

        /**
         * Change the password
         *
         * @param {ActionContext} context
         * @param {object} data
         * @returns {Promise<boolean|string>} True if successful, or a reason if not
         */
        async changePassword(context, data) {
            let response = await Backend.post('/account/password', data);
            if (response.data.success) {
                return true;
            }
            return response.data.reason;
        },

        // Users
        fetchUser(context, {userId}) {
            return Cache.ifNotFresh('user', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}`);
                let user = response.data.user;
                Vue.set(context.state.users, user.id, user);
            });
        },

        fetchUsers(context) {
            return Cache.ifNotFresh('users', null, 10000, async () => {
                let response = await Backend.get('/users');
                let users = {};
                for (let user of response.data.users) {
                    users[user.id] = user;
                }
                Vue.set(context.state, 'users', users);
                context.state.allUserIds = response.data.users.map(user => user.id);
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
                if (response.data.participations) {
                    for (let participation of response.data.participations) {
                        let key = `${participation.eventId}/${participation.userId}`;
                        Vue.set(context.state.singleParticipations, key, participation);
                    }
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

        async saveParticipation(context, {eventId, userId, ...data}) {
            await Backend.post(`/events/${eventId}/participations/${userId}`, data);
            Cache.invalidate('event', eventId);
            Cache.invalidate('participations', eventId);
            Cache.invalidate('participation', `${eventId}/${userId}`);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await context.dispatch('fetchParticipations', {eventId});
        },

        async fetchTransfers(context, {eventId}) {
            await Cache.ifNotFresh('transfers', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/transfers`);
                let transfers = response.data.transfers;
                Vue.set(context.state.transfers, eventId, transfers);
            });

            let promises = context.state.transfers[eventId]
                .map(t => Promise.all([
                    context.dispatch('fetchUser', {userId: t.senderId}),
                    context.dispatch('fetchUser', {userId: t.recipientId}),
                ]));
            await Promise.all(promises);
        },

        async saveTransfers(context, {eventId, transfers}) {
            await Backend.post(`/events/${eventId}/transfers`, transfers);
            Cache.invalidate('event', eventId);
            Cache.invalidate('transfers', eventId);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await context.dispatch('fetchTransfers', {eventId});
        },

        async saveEvent(context, data) {
            let url = data.id ? `/events/${data.id}` : '/events';
            let response = await Backend.post(url, {...data, id: undefined});

            Cache.invalidate('user');
            Cache.invalidate('users');
            Cache.invalidate('events');
            let eventId = null;

            if (data.id) {
                eventId = data.id;
                Cache.invalidate('event', eventId);
                Cache.invalidate('participation');
                Cache.invalidate('participations', eventId);
            } else {
                let location = response.headers.location;
                let match = location.match(/^\/api\/events\/(?<id>\d+)$/u);
                if (match) {
                    eventId = match.groups.id;
                }
            }

            if (eventId) {
                await context.dispatch('fetchEvent', {eventId});
                await context.dispatch('fetchParticipations', {eventId});
            }

            return eventId;
        },

        async deleteEvent(context, {eventId}) {
            let response = await Backend.delete(`/events/${eventId}`);
            if (response.status === 204) {
                Vue.delete(context.state.events, eventId);
                Cache.invalidate('event', eventId);
                Cache.invalidate('events');
                Cache.invalidate('user');
                Cache.invalidate('users');
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

        fetchAuditLog(context, force = false) {
            if (force) {
                Cache.invalidate('audits');
            }
            return Cache.ifNotFresh('audits', 0, 5000, async () => {
                let response = await Backend.get('/audits?with=names');
                let audits = response.data.audits;
                for (let audit of audits) {
                    audit.date = new Date(audit.date);
                }
                context.state.audits = audits;
            });
        },

        fetchSettings(context) {
            return Cache.ifNotFresh('settings', 0, 5000, async () => {
                let response = await Backend.get('/settings');
                let settings = response.data.settings;
                // Complete default opt-ins
                for (let i = 1; i <= 5; i++) {
                    settings[`defaultOptIn${i}`] ??= 'undecided';
                }
                settings.quickOptIn ??= 'omnivorous';
                context.state.settings = settings;
            });
        },

        async saveSettings(context, settings) {
            await Backend.post('/settings', settings);
            Cache.invalidate('settings');
            await context.dispatch('fetchSettings');
        },
    },
});
