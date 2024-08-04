import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {setDoc, doc, query, collection, where, getDocs, getDoc} from "firebase/firestore";
import { db } from '@/firebase'

const account = {
  state: {
    boxState: {
      boxName: '',
      email: '',
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
      state.boxState.email = payload.email
    },
    SET_BOX_STATE_EMPTY(state) {
      state.boxState.boxName = ''
      state.boxState.email = ''
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
      const userCredential = await signInWithEmailAndPassword(auth, payload.email, payload.password)
      const idToken = await userCredential.user.getIdToken()
      const idTokenResult = await userCredential.user.getIdTokenResult()
      localStorage.setItem('userToken', idToken)
      localStorage.setItem('tokenExpiration', idTokenResult.expirationTime)
      localStorage.setItem('id', idTokenResult)
    },
    async logout() {
      const auth = getAuth()
      await signOut(auth)
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
    async getBox({commit, state}) {
      const boxName = localStorage.getItem('boxName')
      const docRef = doc(db, "box", boxName)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        commit('SET_BOX', docSnap.data())
      }
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
        localStorage.setItem('boxName', user[0].boxName)
        commit('SET_BOX_STATE', {
          boxName: user[0].boxName,
          email: user[0].email,
        })
      }
    },
  },
  getters: {}
}

export default account
