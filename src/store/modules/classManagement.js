import { getDocs, collection, query, getDoc, doc, setDoc } from "firebase/firestore";
import { db } from '@/firebase'

const classManagement = {
  state: {
    classes: [],
  },
  mutations: {
    SET_CLASSES(state, values) {
      state.classes = values
    }
  },
  actions: {
    async getDailyClasses({commit}) {
      const box = 'Crossfit J'
      const date = '20230910'
      const path = `/box/${box}/class/${date}/time`
      const querySnap = await getDocs(query(collection(db, path)));
      const classes = []
      querySnap.forEach((doc) => {
        classes.push(doc.data())
      })
      console.log(classes)
      // commit('SET_CLASSES', classes)
    },
    async getClass({commit}) {
      const box = 'Crossfit J'
      const date = '20230908'
      const time = '07000800'
      const path = `/box/${box}/class/${date}/time`
      const docSnap = await getDoc(doc(db, path, time))
      console.log(docSnap.data().reserved[1])
      const ref = docSnap.data().reserved[1]
      const refResult = await getDoc(ref)
      console.log(refResult.data())
    },
    async setClass({commit}, payload) {
      const {box, date, time, coach, cap} = payload
      const path = `/box/${box}/class/${date}/time`
      await setDoc(doc(db, path, time), {
        cap: cap,
        coach: coach,
        time: time,
        reserved: [],
      })

    }
  },
  getters: {

  },
}

export default classManagement
