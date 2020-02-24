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
                date: '23.02.20',
                weekday: 'Friday',
                isToday: true,
                participants: {
                    meat: 9,
                    vegi: 3
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
                id: 13,
                name: 'Sandwich Action',
                date: '27.02.20',
                weekday: 'Thursday',
                isToday: false,
                participants: {
                    meat: 9,
                    vegi: 3
                }
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
        getMenuById: (state) => (id) => {
            return state.menus.find(menu => menu.id == id);
        },
        getTodoById: (state) => (id) => {
            return state.todos.find(todo => todo.id === id)
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
