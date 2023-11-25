import { getDocs, query, collection, where, updateDoc, deleteDoc } from "firebase/firestore"
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
        where('boxName', '==', payload.box),
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
        where('boxApply', '==', payload.box),  // boxApply가 'CFBD'인 문서
        where('boxName', '==', ''),       // boxName이 빈 문자열인 문서
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
        where('email', '==', payload.email),
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
    async getUserRef({commit}, payload) {
      const path = `/user`
      const q = query(collection(db, path),
        where('email', '==', payload.email),
      )
      const querySnap = await getDocs(q)
      const userRef = []
      querySnap.forEach((doc) => {
        userRef.push(doc.ref)
      })
      if (userRef.length === 1) {
        return userRef[0]
      }
    },
    async approveMember(context, payload) {
      const memberRef = await context.dispatch('getMemberRef', payload)
      const userRef = await context.dispatch('getUserRef', payload)
      payload.boxName = payload.box
      payload.boxApply = ''
      delete payload.box
      await updateDoc(memberRef, payload)
      await updateDoc(userRef, payload)
    },
    async rejectMember(context, payload) {
      const ref = await context.dispatch('getMemberRef', payload)
      await deleteDoc(ref)
    },
    //TODO: 추후 update member로 통합
    async registerMembership(context, payload) {
      const ref = await context.dispatch('getMemberRef', payload)
      delete payload.box
      await updateDoc(ref, payload)
    }
  },
  getters: {}
}

export default member
