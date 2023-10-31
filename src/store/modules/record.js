import {collection, getDoc, getDocs, query, where} from "firebase/firestore";
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
      const box = "CFBD"
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
    }
  },
  modules: {},
}

export default record
