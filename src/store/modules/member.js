import { getDocs, query, collection, where, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from '@/firebase'
import { calculateRemainingDays, initializeMember, removeDaysFromMember } from "@/views/admin/util/member"

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
        let member = initializeMember(doc.data())
        members.push(member)
      })

      commit('SET_MEMBERS', members)
    },
    async getPendingMembers({commit}, payload) {
      const path = `/box/${payload.box}/member`
      const q = query(collection(db, path),
        where('boxApply', '==', payload.box),
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
      const memberRef = await context.dispatch('getMemberRef', payload)
      const userRef = await context.dispatch('getUserRef', payload)
      payload.boxApply = ''
      payload.boxName = ''
      delete payload.box
      await deleteDoc(memberRef)
      await updateDoc(userRef, payload)
    },
    async registerMembership(context, payload) {
      const memberRef = await context.dispatch('getMemberRef', payload)
      const userRef = await context.dispatch('getUserRef', payload)
      delete payload.box
      let member = removeDaysFromMember(payload)
      await updateDoc(memberRef, member)
      await updateDoc(userRef, member)
    }
  },
  getters: {}
}

export default member
