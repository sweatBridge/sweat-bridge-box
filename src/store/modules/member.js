import { getDocs, query, collection, where, updateDoc } from "firebase/firestore"
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
    },
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
    },
    async getMemberRef({commit}, payload) {
      const path = `/box/${payload.box}/member`
      const q = query(collection(db, path),
        where('id', '==', payload.id),
      )
      const querySnap = await getDocs(q)
      const memberRef = []
      querySnap.forEach((doc) => {
        memberRef.push(doc.ref)
      })
      if (memberRef.length === 1) {
        return memberRef[0]
      }
    },
    async approveMember(context, payload) {
      const ref = await context.dispatch('getMemberRef', payload)
      delete payload.box
      payload.state = true
      await updateDoc(ref, payload)
    }
  },
  getters: {}
}

export default member
