import { getDocs, query, collection, where, updateDoc, setDoc, doc } from "firebase/firestore"
import { db } from '@/firebase'
import { initializeMember, removeDaysFromMember } from "@/views/admin/util/member"

const member = {
  state: {
    members: [],
  },
  mutations: {
    SET_MEMBERS(state, members) {
      state.members = members
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
    async getUserByEmail({commit}, payload) {
      const path = `/user`
      const q = query(collection(db, path),
        where('email', '==', payload.email),
      )
      const querySnap = await getDocs(q)
      let userData = null
    
      querySnap.forEach((doc) => {
        userData = doc.data()
      })
    
      return userData
    },
    async getUserByPhone({ commit }, payload) {
      const path = "/user";
      const q = query(collection(db, path), where("phone", "==", payload.phone));
      const querySnap = await getDocs(q);
      let userData = null;
    
      querySnap.forEach((doc) => {
        userData = doc.data();
      });
    
      return userData;
    },

    async createMember({ commit }, payload) {
      const box = localStorage.getItem('boxName')
      try {
        const path = `/box/${box}/member`
        const memberData = payload

        // email을 문서 ID로 사용
        const memberDocRef = doc(collection(db, path), payload.email)

        await setDoc(memberDocRef, memberData)

        console.log('멤버가 추가되었습니다. 문서 ID:', memberDocRef.id)
        return memberDocRef
      } catch (error) {
        console.error('멤버 추가 중 오류 발생:', error)
        throw error
      }
    },

    async updateUser({ commit }, payload) {
      try {
        const path = `/user`
        const q = query(
          collection(db, path),
          where('email', '==', payload.email)
        )
        const querySnap = await getDocs(q)

        if (querySnap.empty) {
          console.warn('해당 이메일로 사용자를 찾을 수 없습니다:', payload.email)

          return null
        }

        // 여러 문서가 있을 수 있지만, 일반적으로는 하나일 것으로 예상
        querySnap.forEach(async (docSnap) => {
          await updateDoc(docSnap.ref, payload)

          return payload
        })

      } catch (error) {
        console.error('사용자 업데이트 중 오류 발생:', error)
        throw error
      }
    },
    
    async approveMember(context, payload) {
      const memberRef = await context.dispatch('getMemberRef', payload)
      const userRef = await context.dispatch('getUserRef', payload)
      payload.boxName = payload.box
      delete payload.box
      await updateDoc(memberRef, payload)
      await updateDoc(userRef, payload)
    },
    async registerMembership(context, payload) {
      const memberRef = await context.dispatch('getMemberRef', payload)
      const userRef = await context.dispatch('getUserRef', payload)
      delete payload.box
      let member = removeDaysFromMember(payload)
      await updateDoc(memberRef, member)
      await updateDoc(userRef, member)
    },
    async getUserByRealName({ commit }, payload) {
      const path = "/user";
      const q = query(collection(db, path), where("realName", "==", payload.realName));
      const querySnap = await getDocs(q);
      const users = [];
    
      querySnap.forEach((doc) => {
        users.push(doc.data());
      });
    
      return users;
    },

    async getUserByNickName({ commit }, payload) {
      const path = "/user";
      const q = query(collection(db, path), where("nickName", "==", payload.nickName));
      const querySnap = await getDocs(q);
      const users = [];
    
      querySnap.forEach((doc) => {
        users.push(doc.data());
      });
    
      return users;
    },
  },
  getters: {}
}

export default member
