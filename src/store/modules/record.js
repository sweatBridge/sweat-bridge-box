import {collection, getDoc, getDocs, query, where} from "firebase/firestore";
import {db} from "@/firebase";

const record = {
  state: {
    records: [],
  },
  mutations: {
    SET_RECORDS(state, records) {
      state.records = records
    }
  },
  actions: {
    async getRecords({commit}, id) {
      const box = "CFBD"
      const path = `/box/${box}/wod/${id}/records`
      const q = query(collection(db, path))
      const querySnap = await getDocs(q)

      const records = []
      querySnap.forEach((doc) => {
        records.push(doc.data())
      })
      commit('SET_RECORDS', records)
    }
  },
  modules: {},
}

export default record
