import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { db } from '@/firebase'

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
    },
    user: {
      boxName: '',
      email: '',
      realName: '',
      nickName: '',
      phone: '',
      role: '',
    }
  },
  mutations: {
    SET_ACCOUNT(state, payload) {
      state.registration = payload
    },
    SET_BOX(state, payload) {
      state.box = payload
    },
    SET_USER(state, payload) {
      state.user = payload
    },
  },
  actions: {
    async signUp({state}) {
      const auth = getAuth()
      await createUserWithEmailAndPassword(auth, state.registration.email, state.registration.password)
    },
    async createBox({state}) {
      const path = `/box/${state.box.boxName}`
      await setDoc(doc(db, path), state.box)
    },
    async createUser({state}) {
      const path = `/user`
      const docKey = state.user.email
      await setDoc(doc(db, path, docKey), {
        boxName: state.user.boxName,
        email: state.user.email,
        realName: state.user.realName,
        nickName: state.user.nickName,
        phone: state.user.phone,
        role: state.user.role,
      })
    },
  },
  getters: {}
}

export default account
