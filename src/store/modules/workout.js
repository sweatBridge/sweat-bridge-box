import { addDoc, collection } from "firebase/firestore";
import { db } from '@/firebase'

const workout = {
  state: {
    wodRegistration: {
      title: '',
      date: null,
      type: '',
      set: 0,
      round: 0,
      timeCap: '00:00',
      movements: [
        {
          name: 'Deadlift',
          measure: '10',
          type: 'Count',
          levelSetting: [
            {
              level: 'Rxd',
              customLevel: '',
              gender: 'M',
              requirement: "220",
            },
            {
              level: 'Rxd',
              customLevel: '',
              gender: 'W',
              requirement: "160",
            }
          ],
          description: '',
        },
        {
          name: 'Double Under',
          measure: '100',
          type: 'Count',
          levelSetting: [
            {
              level: 'Rxd',
              gender: 'M',
              requirement: "Double Under",
            },
            {
              level: 'Rxd',
              gender: 'W',
              requirement: "Single Under",
            }
          ],
          description: 'test description',
        },
      ],
      customMovements: '',
      description: '',
    },
    recentRegisteredWodList: [],
    registeredWod: {
      title: '',
      date: null,
      type: '',
      set: 0,
      round: 0,
      timeCap: '00:00',
      movements: [],
      customMovements: '',
      description: '',
    },
  },
  mutations: {
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
          console.log(state.wodRegistration)
          console.log("Document written with ID: ", docRef.id)
        })
        .catch((error) => {
          console.error("Error adding document: ", error)
        })
    },
  },
  getters: {}
}

export default workout
