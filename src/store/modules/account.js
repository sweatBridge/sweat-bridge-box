import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import {setDoc, doc, query, collection, where, getDocs} from "firebase/firestore";
import { db } from '@/firebase'

const account = {
  state: {
    boxState: {
      boxName: '',
    },
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
    SET_BOX_STATE(state, payload) {
      state.boxState.boxName = payload.boxName
    },
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
    async login({commit}, payload) {
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, payload.email, payload.password)
    },
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
    async setBoxState({commit, state}, payload) {
      const path = `/user`
      const q = query(collection(db, path),
        where('email', '==', payload.email),
      )
      const querySnap = await getDocs(q)
      const user = []
      querySnap.forEach((doc) => {
        user.push(doc.data())
      })
      if (user.length === 1) {
        commit('SET_BOX_STATE', {
          boxName: user[0].boxName,
        })
      }
    }
  },
  getters: {}
}

export default account
