const account = {
  state: {
    registration: {
      email: '',
      password: '',
      boxName: '',
    },
    box: {
      boxName: '',
      email: '',
      representative: '',
      phone: '',
      address: {
        zoneCode: '',
        roadAddress: '',
        detailAddress: '',
      },
      description: '',
      coaches: [],
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
