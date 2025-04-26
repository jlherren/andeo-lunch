import Backend from '@/store/backend';
import Cache from '@/store/cache';
import PackageJson from '../../../package.json';
import Vue from 'vue';
import {defineStore} from 'pinia';
import {getDeviceId} from '@/utils/device';

export let useStore = defineStore('main', {
    state: () => ({
        globalSnackbar: null,

        // System information
        version:     PackageJson.version,
        buildDate:   process.env.VUE_APP_BUILD_TIMESTAMP ? new Date(+process.env.VUE_APP_BUILD_TIMESTAMP * 1000) : null,
        buildCommit: process.env.VUE_APP_BUILD_COMMIT ?? 'Unknown',

        payUpDefaultRecipient:    null,
        defaultFlatRate:          null,
        defaultParticipationRate: null,
        decommissionContraUser:   null,

        account: {
            initialCheckCompleted: false,
            userId:                null,
            username:              null,
            permissions:           [],
        },

        usersById: {
            // Users by ID
        },

        paymentInfosById: {
            // By user ID
        },

        _absences: {
            // By user ID
        },

        // All user IDs and visible user IDs
        _allUserIds:     [],
        _visibleUserIds: [],

        _events: {
            // Events by ID
        },

        _participations: {
            // Participations by event ID
        },

        _singleParticipations: {
            // Single participations by event ID and user ID.  Key format `${eventId}/${userId}`
        },

        transfersById: {
            // Transfers by event ID
        },

        transactionsById: {
            // Transactions by user ID

            // TODO: Unload these again when not needed?  How to handle very old history to avoid memory pressure?
        },

        // Misc
        audits:   [],
        settings: {},

        // Grocery list
        groceries: [],

        nSnowFlakes: null,
    }),

    getters: {
        // Users and account
        user:         state => userId => state.usersById[userId] ?? {id: userId},
        users:        state => state._visibleUserIds.map(userId => state.user(userId)),
        visibleUsers: state => state._visibleUserIds.map(userId => state.user(userId)),
        allUsers:     state => state._allUserIds.map(userId => state.user(userId)),
        paymentInfo:  state => userId => state.paymentInfosById[userId] ?? null,
        absences:     state => userId => state._absences[userId] ?? null,

        // Own user
        isLoggedIn:          state => state.account.userId !== null,
        ownUserId:           state => state.account.userId,
        ownUsername:         state => state.account.username,
        ownUser:             state => state.user(state.ownUserId),
        hasPermission:       state => permission => state.account.permissions.includes(permission),
        hasPermissionPrefix: state => prefix => state.account.permissions.some(permission => permission.startsWith(prefix)),

        // Events
        events:         state => Object.values(state._events),
        event:          state => eventId => state._events[eventId],
        participations: state => eventId => state._participations[eventId],
        participation:  state => (eventId, userId) => state._singleParticipations[`${eventId}/${userId}`],
        transfers:      state => eventId => state.transfersById[eventId],

        // Transactions
        transactions: state => userId => state.transactionsById[userId],
    },

    actions: {
        setGlobalSnackbar(text) {
            this.globalSnackbar = text;
        },

        // Account
        async login(data) {
            let response = await Backend.post('/account/login', data);
            localStorage.setItem('token', response.data.token);
            // Fetch all users, see comment in checkLogin()
            await this.fetchUsers();
            // Don't set the following until after the user is fetched, otherwise 'ownUser' won't be reliable
            this.account.userId = response.data.userId;
            this.account.username = response.data.username;
            this.account.permissions = response.data.permissions;
        },

        logout() {
            localStorage.removeItem('token');
            this.account.userId = null;
            this.setGlobalSnackbar('You have been logged out');
        },

        async checkLogin() {
            // Create a device ID even when there is no token.
            let deviceId = getDeviceId();
            let userId = null;
            let username = null;
            let permissions = [];
            let shouldRenew = false;
            if (Backend.hasToken()) {
                let response = await Backend.get(`/account/check?device=${deviceId}&version=${this.version}`);
                ({userId, username, shouldRenew, permissions} = response.data);
            }

            if (userId) {
                // Fetch all users, so that by policy we always have users available.  This allows us to never wait for
                // promises that fetch users.
                await this.fetchUsers();
            }

            // This should not be set before the above fetchUser is finished, otherwise 'ownUser' won't be reliable
            this.account.userId = userId;
            this.account.username = username;
            this.account.permissions = permissions;
            this.account.initialCheckCompleted = true;

            // Finally, renew the token if necessary, but don't wait for it to complete
            if (shouldRenew) {
                // noinspection ES6MissingAwait
                this.renewToken();
            }
        },

        async renewToken() {
            let response = await Backend.post('/account/renew');
            localStorage.setItem('token', response.data.token);
        },

        /**
         * Change the password
         *
         * @param {object} data
         * @return {Promise<boolean|string>} True if successful, or a reason if not
         */
        async changePassword(data) {
            let response = await Backend.post('/account/password', data);
            if (response.data.success) {
                return true;
            }
            return response.data.reason;
        },

        // Users
        async fetchUser(userId) {
            if (userId === -1) {
                return;
            }
            await Cache.ifNotFresh('user', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}`);
                let user = response.data.user;
                Vue.set(this.usersById, user.id, user);
            });
        },

        fetchUsers() {
            return Cache.ifNotFresh('users', 0, 10000, async () => {
                let response = await Backend.get('/users');
                let users = {};
                for (let user of response.data.users) {
                    users[user.id] = user;
                    Cache.validate('user', user.id);
                }
                Vue.set(this, 'usersById', users);
                this._visibleUserIds = response.data.users
                    .filter(user => !user.hidden)
                    .map(user => user.id);
                this._allUserIds = response.data.users
                    .map(user => user.id);
            });
        },

        // Events
        fetchEvents(params) {
            return Cache.ifNotFresh('events', JSON.stringify(params), 10000, async () => {
                let response = await Backend.get('/events', {params});
                for (let event of response.data.events) {
                    event.date = new Date(event.date);
                    Vue.set(this._events, event.id, event);
                }
                if (response.data.participations) {
                    for (let participation of response.data.participations) {
                        let key = `${participation.eventId}/${participation.userId}`;
                        Vue.set(this._singleParticipations, key, participation);
                    }
                }
            });
        },

        fetchEvent(eventId) {
            return Cache.ifNotFresh('event', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}`);
                let event = response.data.event;
                event.date = new Date(event.date);
                Vue.set(this._events, event.id, event);
            });
        },

        async fetchParticipations(eventId) {
            await Cache.ifNotFresh('participations', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/participations`);
                let participations = response.data.participations;
                Vue.set(this._participations, eventId, participations);

                for (let participation of participations) {
                    let key = `${eventId}/${participation.userId}`;
                    Cache.validate('participation', key);
                    Vue.set(this._singleParticipations, key, participation);
                }
            });

            // Fetch all users, not just the ones from the participations
            // noinspection ES6MissingAwait
            this.fetchUsers();
        },

        saveParticipation({eventId, userId, ...data}) {
            return this.saveParticipations(eventId, [{userId, ...data}]);
        },

        async saveParticipations(eventId, participations) {
            await Backend.post(`/events/${eventId}/participations`, {participations});

            Cache.invalidate('event', eventId);
            Cache.invalidate('participations', eventId);
            for (let participation of participations) {
                Cache.invalidate('participation', `${eventId}/${participation.userId}`);
            }
            Cache.invalidate('user');
            Cache.invalidate('users');

            await this.fetchParticipations(eventId);

            // Also refetch user balances, but do not wait until it completes.
            // noinspection ES6MissingAwait
            this.fetchUsers();
        },

        async fetchTransfers(eventId) {
            await Cache.ifNotFresh('transfers', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/transfers`);
                let transfers = response.data.transfers;
                Vue.set(this.transfersById, eventId, transfers);
            });

            // Fetch all users, not just the ones from the transfers
            // noinspection ES6MissingAwait
            this.fetchUsers();
        },

        async saveTransfers({eventId, transfers}) {
            await Backend.post(`/events/${eventId}/transfers`, transfers);
            Cache.invalidate('event', eventId);
            Cache.invalidate('transfers', eventId);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await this.fetchEvent(eventId);
            await this.fetchTransfers(eventId);
        },

        async deleteTransfer({eventId, transferId}) {
            await Backend.delete(`/events/${eventId}/transfers/${transferId}`);
            Cache.invalidate('event', eventId);
            Cache.invalidate('transfers', eventId);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await this.fetchEvent(eventId);
            await this.fetchTransfers(eventId);
        },

        async saveEvent(data) {
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
                    eventId = parseInt(match.groups.id, 10);
                }
            }

            if (eventId) {
                await Promise.all([
                    this.fetchEvent(eventId),
                    this.fetchParticipations(eventId),
                ]);
            }

            return eventId;
        },

        async deleteEvent(eventId) {
            let response = await Backend.delete(`/events/${eventId}`);
            if (response.status === 204) {
                Vue.delete(this._events, eventId);
                Cache.invalidate('event', eventId);
                Cache.invalidate('transfers', eventId);
                Cache.invalidate('events');
                Cache.invalidate('user');
                Cache.invalidate('users');
            }
        },

        fetchTransactions(userId) {
            return Cache.ifNotFresh('transactions', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}/transactions?with=eventName`);
                let transactions = response.data.transactions;
                for (let transaction of transactions) {
                    transaction.date = new Date(transaction.date);
                }
                Vue.set(this.transactionsById, userId, transactions);
            });
        },

        fetchAuditLog(force = false) {
            if (force) {
                Cache.invalidate('audits');
            }
            return Cache.ifNotFresh('audits', 0, 5000, async () => {
                let response = await Backend.get('/audits?with=names');
                let audits = response.data.audits;
                for (let audit of audits) {
                    audit.date = new Date(audit.date);
                    if (audit.eventDate) {
                        audit.eventDate = new Date(audit.eventDate);
                    }
                }
                this.audits = audits;
            });
        },

        fetchSettings() {
            return Cache.ifNotFresh('settings', 0, 5000, async () => {
                let response = await Backend.get('/settings');
                let settings = response.data.settings;
                // Complete default opt-ins
                for (let i = 1; i <= 5; i++) {
                    settings[`defaultOptIn${i}`] ??= 'undecided';
                }
                settings.quickOptIn ??= 'omnivorous';
                this.settings = settings;
            });
        },

        async saveSettings(settings) {
            await Backend.post('/settings', settings);
            Cache.invalidate('settings');
            await this.fetchSettings();
        },

        fetchPayUpDefaultRecipient() {
            return Cache.ifNotFresh('payUp.defaultRecipient', 0, 60000, async () => {
                let response = await Backend.get('/pay-up/default-recipient');
                this.payUpDefaultRecipient = response.data.defaultRecipient;
            });
        },

        fetchDefaultFlatRate() {
            return Cache.ifNotFresh('lunch.defaultFlatRate', 0, 60000, async () => {
                let response = await Backend.get('/options/default-flat-rate');
                this.defaultFlatRate = response.data.defaultFlatRate;
            });
        },

        fetchDefaultParticipationFee() {
            return Cache.ifNotFresh('lunch.defaultParticipationFee', 0, 60000, async () => {
                let response = await Backend.get('/options/default-participation-fee');
                this.defaultParticipationFee = response.data.defaultParticipationFee;
            });
        },

        fetchDecommissionContraUser() {
            return Cache.ifNotFresh('lunch.defaultFlatRate', 0, 60000, async () => {
                let response = await Backend.get('/options/decommission-contra-user');
                this.decommissionContraUser = response.data.decommissionContraUser;
            });
        },

        fetchUserPaymentInfo(userId) {
            return Cache.ifNotFresh('paymentInfo', userId, 60000, async () => {
                let response = await Backend.get(`/users/${userId}/payment-info`);
                Vue.set(this.paymentInfosById, userId, response.data.paymentInfo);
            });
        },

        fetchAbsences(userId) {
            return Cache.ifNotFresh('absences', userId, 60000, async () => {
                let response = await Backend.get(`/users/${userId}/absences`);
                Vue.set(this._absences, userId, response.data.absences);
            });
        },

        async saveAbsence({userId, ...data}) {
            await Backend.post(`/users/${userId}/absences`, data);
            Cache.invalidate('absences', userId);
            await this.fetchAbsences(userId);
        },

        async deleteAbsence({userId, absenceId}) {
            let response = await Backend.delete(`/users/${userId}/absences/${absenceId}`);
            if (response.status === 204) {
                Vue.delete(this._absences, absenceId);
                Cache.invalidate('absences', userId);
            }
            await this.fetchAbsences(userId);
        },

        fetchGroceries() {
            return Cache.ifNotFresh('groceries', 0, 5000, async () => {
                let response = await Backend.get('/groceries');
                this.groceries = response.data.groceries;
            });
        },

        async saveGrocery({id, noUpdateOrder = false, refresh = true, ...grocery}) {
            let url = id ? `/groceries/${id}` : '/groceries';
            if (noUpdateOrder) {
                url += '?noUpdateOrder=1';
            }

            await Backend.post(url, grocery);
            Cache.invalidate('groceries');
            if (refresh) {
                await this.fetchGroceries();
            }
        },

        async deleteGrocery({id, refresh = true}) {
            await Backend.delete(`/groceries/${id}`);
            Cache.invalidate('groceries');
            if (refresh) {
                await this.fetchGroceries();
            }
        },

        /**
         * @return {Promise<{
         *     versions: Array<{version: string, count: number}>,
         *     period: string,
         * }>}
         */
        async deviceVersions() {
            let response = await Backend.get('/tools/device-versions');
            return response.data;
        },

        /**
         * @return {Promise<Array<{name: string, value: any}>>}
         */
        async fetchConfigurations() {
            let response = await Backend.get('/tools/configurations');
            return response.data.configurations;
        },

        /**
         * @param {string} name
         * @param {string} value
         * @return {Promise<void>}
         */
        async saveConfiguration(name, value) {
            await Backend.post('/tools/configurations', {
                configurations: [
                    {name, value},
                ],
            });
        },

        /**
         * @return {Promise<Array<{username: string, name: string}>>}
         */
        async adminFetchUsers() {
            let response = await Backend.get('/admin/users');
            return response.data.users;
        },

        /**
         * @param {Object} options
         * @param {number} options.id
         * @param {Object} options.user
         * @return {Promise<void>}
         */
        async adminSaveUser({id, ...user}) {
            await Backend.post(`/admin/users/${id}`, user);
        },

        /**
         * @param {Object} user
         * @return {Promise<number>}
         */
        async adminCreateUser(user) {
            let response = await Backend.post('/admin/users', user);
            return response.data.userId;
        },

        /**
         * @param {number} id
         * @param {string} newPassword
         * @param {string} ownPassword
         * @return {Promise<true|string>}
         */
        async adminResetPassword(id, newPassword, ownPassword) {
            let response = await Backend.post(`/admin/users/${id}/password`, {
                newPassword,
                ownPassword,
            });
            if (response.data.success) {
                return true;
            }
            return response.data.reason;
        },

        fetchSnowfall() {
            return Cache.ifNotFresh('nSnowFlakes', 0, 60000, async () => {
                let response = await Backend.get('/snowfall');
                this.nSnowFlakes = response.data.nFlakes;
            });
        },

        /**
         * @param {Object<string, any>} options
         * @return {Promise<string>}
         */
        async icsLink(options) {
            let response = await Backend.post('/ics/link', options);
            return response.data.url;
        },
    },
});
