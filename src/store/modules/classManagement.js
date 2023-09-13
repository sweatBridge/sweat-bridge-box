import { getDocs, collection, query, getDoc, doc, setDoc, where, Timestamp } from "firebase/firestore";
import { db } from '@/firebase'
import {extractDateTimeFromDocKey} from "@/views/admin/class/classCalendarUtils";

const classManagement = {
  state: {
    classes: [],
  },
  mutations: {
    SET_CLASSES(state, payload) {
      state.classes = payload.classes
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
    },
    //payload: {calendarApi}
    async getMonthlyClasses({commit}, payload) {
      let calendarApi = payload.calendarApi
      const today = new Date()
      const startDt = new Date()
      const endDt = new Date()
      startDt.setDate(today.getDate() - 1)
      endDt.setDate(startDt.getDate() + 30)
      const path = `/box/${payload.box}/class`
      const q = query(collection(db, path),
        where('date', '>=', startDt),
        where('date', '<', endDt)
      )
      const querySnap = await getDocs(q);

      querySnap.forEach((doc) => {
        const docKey = doc._key.getCollectionPath().get(3)
        const {year, month, day, startHour, startMin, endHour, endMin} = extractDateTimeFromDocKey(docKey)
        const event = doc.data()
        event.id = docKey
        event.title = payload.box + " WOD"
        event.start = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour}:${startMin}:00+09:00`
        event.end = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour}:${endMin}:00+09:00`
        event.extendedProps = {
          coach: event.coach,
          cap: event.cap,
        }
        calendarApi.addEvent(event)
      })
    },
    async getClass({commit}) {
      const box = 'Crossfit J'
      const date = '20230908'
      const time = '07000800'
      const path = `/box/${box}/class/${date}/time`
      const docSnap = await getDoc(doc(db, path, time))

      const classes = []
      classes.push(docSnap.data())
      commit('SET_CLASSES', {
        classes: classes
      })
    },
    async setClass({commit}, payload) {
      const {docKey, box, coach, cap} = payload
      const {year, month, day} = extractDateTimeFromDocKey(docKey)
      const path = `/box/${box}/class`
      const date = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
      await setDoc(doc(db, path, docKey), {
        cap: cap,
        coach: coach,
        date: Timestamp.fromDate(date),
        reserved: [],
      })

    },
  },
  getters: {
    getClasses: function (state) {
      return state.classes
    }
  },
}

export default classManagement
