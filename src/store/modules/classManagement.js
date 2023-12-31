import { getDocs, collection, query, getDoc, doc, setDoc, where, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '@/firebase'
import {extractDateTimeFromDocKey} from "@/views/admin/class/classCalendarUtils";

const classManagement = {
  state: {},
  mutations: {},
  actions: {
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
          reserved: event.reserved,
        }
        event.color = 'rgba(105,143,241,0.99)'
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
      const {year, month, day, startHour, startMin} = extractDateTimeFromDocKey(docKey)
      const path = `/box/${box}/class`
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`)
      await setDoc(doc(db, path, docKey), {
        cap: cap,
        coach: coach,
        date: Timestamp.fromDate(date),
        reserved: [],
      })
    },
    async update({commit}, payload) {
      const {docKey, box, coach, cap, reserved} = payload
      const {year, month, day, startHour, startMin} = extractDateTimeFromDocKey(docKey)
      const path = `/box/${box}/class`
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`)
      await updateDoc(doc(db, path, docKey), {
        cap: cap,
        coach: coach,
        date: Timestamp.fromDate(date),
        reserved: reserved,
      })
    },
    async delete({commit}, payload) {
      const {docKey, box} = payload
      const path = `/box/${box}/class`
      await deleteDoc(doc(db, path, docKey))
    }
  },
  getters: {}
}

export default classManagement
