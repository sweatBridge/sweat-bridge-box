const account = {
  state: {
    registration: {
      id: '',
      password: '',
      name: '',
    },
  },
  mutations: {
    SET_ACCOUNT(state, payload) {
      state.registration = payload
    },
  },
  actions: {

  },
  getters: {}
}

export default account
