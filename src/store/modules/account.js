const account = {
  state: {
    registration: {
      id: '',
      password: '',
      name: '',
    },
    box: {
      name: '',
      email: '',
      representative: '',
      phone: '',
      zoneCode: '',
      roadAddress: '',
      detailAddress: '',
      description: '',
    }
  },
  mutations: {
    SET_ACCOUNT(state, payload) {
      state.registration = payload
    },
    SET_BOX(state, payload) {
      state.box = payload
    }
  },
  actions: {

  },
  getters: {}
}

export default account
