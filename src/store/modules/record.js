import {collection, getDoc, getDocs, query, where, setDoc, doc} from "firebase/firestore";
import {db} from "@/firebase";

const record = {
  state: {
    records: [],
    feedbacks: [],
  },
  mutations: {
    SET_RECORDS(state, records) {
      state.records = records
    },
    SET_FEEDBACKS(state, feedbacks) {
      state.feedbacks = feedbacks
    }
  },
  actions: {
    async getRecords({commit}, id) {
      const box = localStorage.getItem('boxName');
      const path = `/box/${box}/wod/${id}/records`
      const q = query(collection(db, path))
      const querySnap = await getDocs(q)

      const records = []
      const feedbacks = []
      querySnap.forEach((doc) => {
        if (doc.data().feedback) {
          feedbacks.push(doc.data())
        }
        if(doc.data().level && doc.data().score) {
          records.push(doc.data())
        }
      })
      commit('SET_RECORDS', records)
      commit('SET_FEEDBACKS', feedbacks)
    },

    async updateUserRecord({}, { wodId, user, record, isRxd }) {
      const box = localStorage.getItem('boxName');
      const path = `/box/${box}/wod/${wodId}/records/${user.email}`;
      
      const recordData = {
        email: user.email,
        gender: user.gender,
        isRxd: isRxd,
        nickName: user.nickName,
        realName: user.realName,
        score: record,
        updatedAt: new Date()
      };

      try {
        await setDoc(doc(db, path), recordData);
        return true;
      } catch (error) {
        console.error('Error adding record:', error);
        throw error;
      }
    }
  },
  modules: {},
}

export default record
