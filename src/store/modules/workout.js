import { addDoc, collection } from "firebase/firestore";
import { db } from '@/firebase'

const workout = {
  state: {
    wodRegistration: {
      title: '',
      date: '',
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
  },
  mutations: {
    removeMovement(state, index) {
      state.wodRegistration.movements.splice(index, 1);
    },
    updateWodTitle(state, title) {
      state.wodRegistration.title = title
    },
    updateWodDate(state, date) {
      state.wodRegistration.date = date
    },
    updateWodType(state, type) {
      state.wodRegistration.type = type
    },
    updateWodSet(state, set) {
      state.wodRegistration.set = set
    },
    updateWodRound(state, round) {
      state.wodRegistration.round = round
    },
    updateWodTimeCap(state, timeCap) {
      state.wodRegistration.timeCap = timeCap
    },
    updateWodCustomMovements(state, customMovements) {
      state.wodRegistration.customMovements = customMovements
    },
    updateWodDescription(state, description) {
      state.wodRegistration.description = description
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
