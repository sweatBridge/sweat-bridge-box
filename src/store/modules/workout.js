const workout = {
  state: {
    wodRegistration: {
      title: '',
      date: '',
      type: '',
      set: 0,
      round: 0,
      timeCap: 0,
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
    }
  },
  actions: {},
  getters: {}
}

export default workout
