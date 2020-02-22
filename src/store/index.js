import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {
      firstName: 'Oliver',
      lastName: 'Wiedemann',
      points: 7.52,
      money: -218.15
    }
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
    }
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
