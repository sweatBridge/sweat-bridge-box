import {addDoc, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where} from "firebase/firestore";
import { db } from '@/firebase'
import {convertDateToKstString} from "@/views/admin/class/classCalendarUtils";
import {generateWodDocKey, selectWodEventColor, validateWod} from "@/views/admin/util/workout";

const workout = {
  state: {
    wodRegistration: {
      title: '',
      date: null,
      type: '',
      scoreType: '',
      isSet: true,
      set: '10',
      round: '0',
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
      scoreType: '',
      isSet: false,
      set: '',
      round: '',
      timeCap: '00:00',
      movements: [],
      customMovements: '',
      description: '',
      records: [],
    },
  },
  mutations: {
    setSelectedDate(state, date) {
      state.wodRegistration.date = date
    },
    setRegisteredWod(state, event) {
      state.registeredWod = event.extendedProps.data
      state.registeredWod.date = typeof event.extendedProps.data.date.toDate === 'function' 
        ? event.extendedProps.data.date.toDate() 
        : event.extendedProps.data.date
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
    updateWodScoreType(state, { target, scoreType }) {
      if (target === 'wodRegistration') {
        state.wodRegistration.scoreType = scoreType
      } else if (target === 'registeredWod') {
        state.registeredWod.scoreType = scoreType
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
    },
    SET_WOD_RECORDS(state, records) {
      state.registeredWod.records = records;
    },
  },
  actions: {
    async addWod({ state }) {
      // 정합성 검증 수행
      const validationResult = validateWod(state.wodRegistration);
  
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }
  
      const box = localStorage.getItem('boxName') || '';
      const path = `/box/${box}/wod`;

      const docKey = generateWodDocKey(state.wodRegistration.date, state.wodRegistration.title)

      try {
        await setDoc(doc(db, path, docKey), state.wodRegistration)
      } catch (error) {
        console.error("Error adding document: ", error);
        throw error;  // 에러를 다시 던져 호출자에게 알림
      }

      // addDoc Sample
      // const collectionRef = collection(db, path);

      // try {
      //   const docRef = await addDoc(collectionRef, state.wodRegistration);
      //   console.log("Document written with ID: ", docRef.id);
      // } catch (error) {
      //   console.error("Error adding document: ", error);
      //   throw error;  // 에러를 다시 던져 호출자에게 알림
      // }
    }, 

    async updateWod({ state }) {
      // 정합성 검증 수행
      const validationResult = validateWod(state.registeredWod);
    
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }
    
      const box = localStorage.getItem('boxName') || '';
      const path = `/box/${box}/wod`;
      const docKey = generateWodDocKey(state.registeredWod.date, state.registeredWod.title)
    
      try {
        await updateDoc(doc(db, path, docKey), state.registeredWod);
      } catch (error) {
        throw error;
      }
    },

    async deleteWod({state}) {
      const box = localStorage.getItem('boxName') || '';
      const path = `/box/${box}/wod`
      const docKey = generateWodDocKey(state.registeredWod.date, state.registeredWod.title)

      try {
        await deleteDoc(doc(db, path, docKey))
      } catch (error) {
        throw error;
      }
    },

    async getRecentRegisteredWodList({state}, payload) {
      let calendarApi = payload.calendarApi
      const path = `/box/${payload.box}/wod`
      const today = new Date()
      const startDt = new Date()
      const endDt = new Date()
      startDt.setDate(today.getDate() - 30)
      endDt.setDate(today.getDate() + 30)
      const q = query(collection(db, path),
        where('date', '>=', startDt),
        where('date', '<', endDt)
      )
      const querySnap = await getDocs(q)

      querySnap.forEach((doc) => {
        // console.log(doc.id, " => ", doc.data())
        const event = {
          id: doc._key.getCollectionPath().get(3),
          title: doc.data().title,
          start: convertDateToKstString(doc.data().date),
          extendedProps: {
            data: doc.data()
          },
          color: selectWodEventColor(doc.data().date),
        }
        calendarApi.addEvent(event)
      })
    },

    async getWodRecords({ commit }, wodId) {
      const box = localStorage.getItem('boxName') || '';
      const path = `/box/${box}/wod/${wodId}/records`;
      const q = query(collection(db, path));
      const querySnap = await getDocs(q);

      const records = [];
      querySnap.forEach((doc) => {
        records.push({
          ...doc.data(),
          id: doc.id
        });
      });
      
      commit('SET_WOD_RECORDS', records);
    },
  },
  getters: {}
}

export default workout
