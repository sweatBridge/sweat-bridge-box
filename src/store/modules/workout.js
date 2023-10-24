import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";
import { db } from '@/firebase'
import {convertDateToKstString} from "@/views/admin/class/classCalendarUtils";

const workout = {
  state: {
    wodRegistration: {
      title: '',
      date: null,
      type: '',
      isSet: false,
      set: 0,
      round: 0,
      timeCap: '00:00',
      movements: [
        {
          name: '',
          measure: '',
          type: '',
          isLevelSet: true,
          levelSetting: [
            {
              level: 'Rxd',
              customLevel: '',
              gender: 'M',
              requirement: "",
            },
            {
              level: 'Rxd',
              customLevel: '',
              gender: 'W',
              requirement: "",
            },
            {
              level: 'Scaled',
              customLevel: '',
              gender: 'None',
              requirement: "",
            }
          ],
          isDescription: false,
          description: '',
        }
      ],
      customMovements: '',
      description: '',
    },
    // recentRegisteredWodList: [],
    registeredWod: {
      id: '',
      title: '',
      date: null,
      type: '',
      isSet: false,
      set: 0,
      round: 0,
      timeCap: '00:00',
      movements: [],
      customMovements: '',
      description: '',
    },
  },
  mutations: {
    setSelectedDate(state, date) {
      state.wodRegistration.date = date
    },
    setRegisteredWod(state, event) {
      state.registeredWod = event.extendedProps.data
      state.registeredWod.date = event.extendedProps.data.date.toDate()
      state.registeredWod.id = event.id
    },
    removeMovement(state, { target, index }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.movements.splice(index, 1)
      } else if (target === 'registeredWod') {
        state.registeredWod.movements.splice(index, 1)
      }
    },
    updateWodTitle(state, { target, title }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.title = title;
      } else if (target === 'registeredWod') {
        state.registeredWod.title = title;
      }
    },
    updateWodDate(state, { target, date }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.date = new Date(date)
      } else if (target === 'registeredWod') {
        state.registeredWod.date = new Date(date)
      }
    },
    updateWodType(state, { target, type }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.type = type
      } else if (target === 'registeredWod') {
        state.registeredWod.type = type
      }
    },
    updateWodIsSet(state, { target, set }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.isSet = set
      } else if (target === 'registeredWod') {
        state.registeredWod.isSet = set
      }
    },
    updateWodSet(state, { target, set }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.set = set
      } else if (target === 'registeredWod') {
        state.registeredWod.set = set
      }
    },
    updateWodRound(state, { target, round }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.round = round
      } else if (target === 'registeredWod') {
        state.registeredWod.round = round
      }
    },
    updateWodTimeCap(state, { target, timeCap }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.timeCap = timeCap
      } else if (target === 'registeredWod') {
        state.registeredWod.timeCap = timeCap
      }
    },
    updateWodCustomMovements(state, { target, customMovements }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.customMovements = customMovements
      } else if (target === 'registeredWod') {
        state.registeredWod.customMovements = customMovements
      }
    },
    updateWodDescription(state, { target, description }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.description = description
      } else if (target === 'registeredWod') {
        state.registeredWod.description = description
      }
    }
  },
  actions: {
    async addWod({state}) {
      const box = "CFBD"
      const path = `/box/${box}/wod`
      const collectionRef = collection(db, path)
      await addDoc(collectionRef, state.wodRegistration)
        .then((docRef) => {
          console.log("Document written with ID: ", docRef.id)
        })
        .catch((error) => {
          console.error("Error adding document: ", error)
        })
    },

    async updateWod({state}) {
      const box = "CFBD"
      const path = `/box/${box}/wod`
      await updateDoc(doc(db, path, state.registeredWod.id), state.registeredWod)
    },

    async deleteWod({state}) {
      const box = "CFBD"
      const path = `/box/${box}/wod`
      await deleteDoc(doc(db, path, state.registeredWod.id))
    },

    async getRecentRegisteredWodList({state}, payload) {
      let calendarApi = payload.calendarApi
      const path = `/box/${payload.box}/wod`
      const startDt = new Date()
      const endDt = new Date()
      endDt.setDate(startDt.getDate() + 14)
      const q = query(collection(db, path),
        where('date', '>=', startDt),
        where('date', '<', endDt)
      )
      const querySnap = await getDocs(q)

      // const wods = []
      querySnap.forEach((doc) => {
        // wods.push(doc.data())
        const event = {
          id: doc._key.getCollectionPath().get(3),
          title: doc.data().title,
          start: convertDateToKstString(doc.data().date),
          extendedProps: {
            data: doc.data()
          }
        }
        calendarApi.addEvent(event)
      })
      // state.recentRegisteredWodList = wods
    }
  },
  getters: {}
}

export default workout
