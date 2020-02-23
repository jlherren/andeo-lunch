import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        user: {
            firstName: 'Oliver',
            lastName: 'Wiedemann',
            points: 7.52,
            money: -218.15,
            settings: {
                weekdays: {
                    monday: true,
                    tuesday: true,
                    wednesday: true,
                    thursday: false,
                    friday: false
                },
                isVegetarian: false,
                generalInfo: null
            }
        },
        menus: [
            {
                id: 5,
                name: 'Russischer Salat',
                date: 'Fr, 23.02.20',
                isToday: true,
                people: {
                    meat: 9,
                    vegi: 3
                }
            },
            {
                id: 10,
                name: 'Pastaplausch',
                date: 'Mo, 24.02.20',
            },
            {
                id: 11,
                name: 'Griechischer Salat',
                date: 'Di, 25.02.20',
            },
            {
                id: 12,
                name: 'Pizza',
                date: 'Mi, 26.02.20',
            },
            {
                id: 13,
                name: 'Sandwich Action',
                date: 'Do, 27.02.20',
            },
        ]
    },
    getters: {
        getUser(state) {
            return state.user;
        },
        getUserName(state) {
            return state.user.firstName + ' ' + state.user.lastName;
        },
        getPoints(state) {
            return state.user.points;
        },
        getMoney(state) {
            return state.user.money;
        },
        isLoggedIn(state) {
            return !!state.user;
        },
        getMenus(state) {
            return state.menus;
        },
        getSettings(state) {
            return state.user.settings;
        }
    },
    mutations: {
        updateSettings(state, newSettings) {
            state.user.settings = newSettings;
        }
    },
    actions: {},
})
