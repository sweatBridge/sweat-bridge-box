import { getDocs, query, collection, where, updateDoc, setDoc, doc, getDoc, deleteDoc, deleteField } from "firebase/firestore"
import { db } from '@/firebase'
import { initializeMember, removeDaysFromMember, getCurrentMemberships } from "@/views/admin/util/member"
import store from ".."

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

      for (const memberDoc of querySnap.docs) {
        let member = memberDoc.data();
        
        // member 문서에서 직접 memberships 정보 가져오기
        const memberships = member.memberships || []
        // 현재 유효한 멤버십 중 첫 번째 것만 저장
        const currentMemberships = getCurrentMemberships(memberships)
        member.memberships = currentMemberships.length > 0 ? currentMemberships[0] : null
        
        members.push(member)
      }

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

    async getWodUserByName({commit}, payload) {
      const path = `/box/${payload.boxName}/member`
      const q = query(collection(db, path),
        where('realName', '==', payload.realName),
      )
      const querySnap = await getDocs(q)
      const users = []
      querySnap.forEach((doc) => {
        users.push(doc.data())
      })

      return users // 배열로 반환
    },

    async getWodUserByEmail({commit}, payload) {
      const path = `/box/${payload.boxName}/member`
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

    async getWodUserByPhone({commit}, payload) {
      const path = `/box/${payload.boxName}/member`
      const q = query(collection(db, path),
        where('phone', '==', payload.phone),
      )
      const querySnap = await getDocs(q)
      let userData = null
    
      querySnap.forEach((doc) => {
        userData = doc.data()
      })
      return userData
    },


    async createMember({ commit }, payload) {
      const box = localStorage.getItem('boxName');
      try {
        const path = `/box/${box}/member`;
        const memberDocRef = doc(collection(db, path), payload.email);

        // Check if document already exists
        const docSnapshot = await getDoc(memberDocRef);
        if (docSnapshot.exists()) {
          console.log(`Member with email ${payload.email} already exists. Skipping creation.`);
          return; // Exit the function
        }

        await setDoc(memberDocRef, payload);
        console.log('멤버가 추가되었습니다. 문서 ID:', memberDocRef.id);
      } catch (error) {
        console.error('멤버 추가 중 오류 발생:', error);
        throw error;
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
    
    async findMembership({ dispatch }, { email, classId, box, isCreate}) {
      const classDocRef = doc(collection(db, `/box/${box}/class`), classId)
      const classSnap = await getDoc(classDocRef);
      const classDateRaw = classSnap.data().date;
      const classDate = classDateRaw?.toDate?.() ?? new Date(classDateRaw);

      const userDoc = await dispatch('getWodUserByEmail', { email: email, boxName: box })
      const memberships = userDoc.memberships
      let membershipIdx = null
      let membership = null

      if (!memberships) {
        throw new Error('회원권이 설정되어 있지 않습니다.');
      }

      for (let i = 0; i < memberships.length; i++) {
        const m = memberships[i];
        const start = m.startDate?.toDate?.() ?? new Date(m.startDate);
        const end = m.endDate?.toDate?.() ?? new Date(m.endDate);

        if (classDate > start && classDate < end) {
          membershipIdx = i
          membership = memberships[i]
        }
      }

      if (isCreate) {
        await store.dispatch("makeReservation", {email, box, membership, membershipIdx, userDoc, classSnap, classDocRef})
      } else {
        await store.dispatch("cancelReservation", {email, box, membership, membershipIdx, userDoc, classSnap, classDocRef})
      }
    },
    async makeReservation({ dispatch }, { email, box, membership, membershipIdx, userDoc, classSnap, classDocRef}) {
      if (['countPass', 'periodPass'].includes(membership.type)) {
        if (!membership) {
          throw new Error('회원권이 만료되었습니다.');
        }

        if (membership.type === 'countPass') {
          if (parseInt(membership.count, 10) <= 0) {
            throw new Error('횟수권을 모두 사용하였습니다.');
          }
          membership.count = (parseInt(membership.count, 10) - 1).toString();
          await dispatch('updateMembershipInfo', {updatedMembership: membership, email: email, box: box, idx: membershipIdx});
        }
        const reservedEntry = `${userDoc.email},${userDoc.realName},${userDoc.nickName}`;
        let reservedArray = classSnap.data().reserved || [];
        reservedArray.push(reservedEntry);
        await updateDoc(classDocRef, { reserved: reservedArray });
      } else {
        throw new Error('회원권에 오류가 발생하였습니다.');
      }
    },
    async cancelReservation({ dispatch }, { email, box, membership, membershipIdx, userDoc, classSnap, classDocRef }) {
      let reservedArray = classSnap.data().reserved || [];
      const emailToRemove = email;
      reservedArray = reservedArray.filter(entry => !entry.startsWith(`${emailToRemove},`));
      await updateDoc(classDocRef, { reserved: reservedArray });
      if (membership?.type === 'countPass') {
        membership.count = (parseInt(membership.count, 10) + 1).toString();
        await dispatch('updateMembershipInfo', {updatedMembership: membership, email: email, box: box, idx: membershipIdx});
      }
    },
    async updateMembershipInfo({ commit }, payload) {
      try {
        const email = payload.email
        const boxName = payload.box
        const index = payload.idx
        const updatedMembership = payload.updatedMembership
        if (!email || !boxName || index === undefined || !updatedMembership) return;

        // box/[boxName]/member 문서 업데이트
        const memberRefQuery = query(
          collection(db, `box/${boxName}/member`),
          where('email', '==', email)
        );
        const memberSnap = await getDocs(memberRefQuery);

        for (const docSnap of memberSnap.docs) {
          const memberData = docSnap.data();
          const memberships = memberData.memberships || [];
          if (index < 0 || index >= memberships.length) continue;

          memberships[index] = updatedMembership;
          await updateDoc(docSnap.ref, { memberships });
        }
      } catch (e) {
        console.error('Error updating membership info:', e);
      }
    },
    async withdrawMember({ dispatch }, payload) {
      // 1. 회원 도큐먼트 참조 가져오기
      const memberRef = await dispatch('getMemberRef', payload);
      // 2. 유저 도큐먼트 참조 가져오기
      const userRef = await dispatch('getUserRef', payload);

      // 3. 회원 도큐먼트 데이터 백업
      let memberData = null;
      if (memberRef) {
        const memberSnap = await getDoc(memberRef);
        memberData = memberSnap.exists() ? memberSnap.data() : null;
      }

      try {
        // 4. 회원 도큐먼트 삭제
        if (memberRef) await deleteDoc(memberRef);

        // 5. 유저 도큐먼트 boxName 필드 빈 문자열로 업데이트
        if (userRef) await updateDoc(userRef, { boxName: "" });

        // 6. 성공 반환
        return { success: true };
      } catch (error) {
        // 7. 롤백 시도: 회원 도큐먼트 복구
        if (memberRef && memberData) {
          await setDoc(memberRef, memberData);
        }
        // 8. 에러 반환
        return { success: false, error };
      }
    },

    async fetchApplicants({ dispatch }, boxName) {
      if (boxName) {
        try {
          // Reference to the single document where applicants are stored as a map
          const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
          const applicantSnap = await getDoc(applicantDocRef);

          const applicants = [];
          if (applicantSnap.exists()) {
            const data = applicantSnap.data(); // This is the full map
            // Iterate through keys (emails) in the map
            for (const email in data) {
              if (data.hasOwnProperty(email)) {
                const applicant = data[email];
                applicants.push({
                  name: applicant.realName || '',
                  email: applicant.email || '',
                  phone: applicant.phone || '',
                  boxName: boxName
                });
              }
            }
          }
          return applicants;
        } catch (error) {
          console.error('Failed to fetch applicants:', error);
          return [];
        }
      }
    },
    async rejectApplicant({ dispatch }, { email, boxName }) {
      try {
        const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
        const userDocRef = doc(db,`user/${email}`)
        await setDoc(applicantDocRef, {
          [email]: deleteField()
        }, { merge: true });
        await updateDoc(userDocRef, {
          boxName: ''
        });
        console.log(`Applicant ${email} removed successfully`);
      } catch (error) {
        console.error('Failed to reject applicant:', error);
      }
    },
    async removeApplication({ dispatch }, { email, boxName }){
      try {
        const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
        const userDocRef = doc(db,`user/${email}`)
        await setDoc(applicantDocRef, {
          [email]: deleteField()
        }, { merge: true });
        await updateDoc(userDocRef, {
          boxName: boxName
        });
        console.log(`Applicant ${email} removed successfully`);
      } catch (error) {
        console.error('Failed to reject applicant:', error);
      }
    }
  },
  getters: {}
}

export default member
