import { getDocs, query, collection, where } from "firebase/firestore"
import { db } from '@/firebase'

const member = {
  state: {
    members: [],
    pendingMembers: [],
  },
  mutations: {
    SET_MEMBERS(state, members) {
      state.members = members
    },
    SET_PENDING_MEMBERS(state, pendingMembers) {
      state.pendingMembers = pendingMembers
    }
  },
  actions: {
    async getMembers({commit}, payload) {
      const path = `/box/${payload.box}/member`
      const q = query(collection(db, path),
        where('state', '==', true),
      )
      const querySnap = await getDocs(q)
      const members = []
      querySnap.forEach((doc) => {
        members.push(doc.data())
      })
      commit('SET_MEMBERS', members)
    },
    async getPendingMembers({commit}, payload) {
      const path = `/box/${payload.box}/member`
      const q = query(collection(db, path),
        where('state', '==', false),
      )
      const querySnap = await getDocs(q)
      const members = []
      querySnap.forEach((doc) => {
        members.push(doc.data())
      })
      commit('SET_PENDING_MEMBERS', members)
    }
  },
  getters: {}
}

export default member
