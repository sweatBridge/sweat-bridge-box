<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>
          <strong>와드 등록</strong>
        </CCardHeader>
        <CCardBody>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">WOD 타이틀</CInputGroupText>
                <CFormInput
                  id="basic-url"
                  aria-describedby="basic-addon3"
                  v-model="wodRegistration.title"
                />
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">WOD 일자</CInputGroupText>
                <CButton>
                  <DatePicker v-model="wodRegistration.date"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">Workout 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="wodRegistration.type" @change="handleTypeChange">
                  <option>타입 선택</option>
                  <option value="ForTime">ForTime</option>
                  <option value="AMRAP">AMRAP</option>
                  <option value="EMOM">EMOM</option>
                  <option value="Tabata">Tabata</option>
                  <option value="Custom">Custom</option>
                </CFormSelect>
              </CInputGroup>
            </CCol>
            <CCol sm="2">
              <div style="height: 8px;"></div>
              <CFormCheck id="setType" label="세트 운동" v-model="isSetType" v-if="!isCustomize" @change="handleSetTypeChange"/>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3" v-if="isSetType">
                <CInputGroupText id="basic-addon3">세트 수</CInputGroupText>
                <CFormInput type="number" id="setCount" aria-describedby="basic-addon3" v-model="wodRegistration.set"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="wodRegistration.type === 'ForTime'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
              </CInputGroup>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.timeCap"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="wodRegistration.type === 'AMRAP'">
            <CCol sm="3" />
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.timeCap"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="wodRegistration.type === 'EMOM'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="wodRegistration.type === 'Tabata'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3" v-model="wodRegistration.round"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="!isCustomize">
            <CCard>
              <CCardHeader color="danger">
                Movements
                <div class="float-end">
                  <CButton
                    color="warning" class="position-relative" size="sm"
                    @click="addRest"
                  >
                    휴식 추가
                  </CButton>
                  <CButton
                    color="info" class="position-relative" size="sm"
                    @click="addMovement"
                  >
                    동작 추가
                  </CButton>
                </div>
              </CCardHeader>
              <CCardBody>
                <MovementCard
                  v-for="(movement, index) in wodRegistration.movements"
                  :key="index"
                  :index="index"
                />
              </CCardBody>
            </CCard>
          </CRow>
          <CRow v-if="isCustomize">
            <CForm>
              <CInputGroupText id="basic-addon3">WOD 커스텀</CInputGroupText>
              <CFormTextarea
                id="exampleFormControlTextarea1"
                rows="10"
                text="자유 형식으로 작성"
                v-model="wodRegistration.customMovements"
              ></CFormTextarea>
            </CForm>
          </CRow>
          <CRow>
            <CForm>
              <CInputGroupText id="basic-addon3">설명</CInputGroupText>
              <CFormTextarea
                id="exampleFormControlTextarea1"
                rows="3"
                text="WOD 설명"
                v-model="wodRegistration.description"
              ></CFormTextarea>
            </CForm>
          </CRow>
        </CCardBody>
        <CCardFooter>
          <div class="float-end">
            <CButton
              color="success" class="position-relative" size="md"
              @click="saveWod"
            >
              저장
            </CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
</template>

<script>
import { defineComponent, ref, watch, reactive } from 'vue'
import { useStore } from "vuex"
import MovementCard from "@/views/admin/movement/MovementCard.vue"
import DatePicker from "vue3-datepicker"

export default defineComponent({
  components: {DatePicker, MovementCard},
  setup(props, {emit}) {
    const store = useStore()
    const isSetType = ref(false)
    const isCustomize = ref(false)
    const wodRegistration = reactive({
      title: store.state.workout.wodRegistration.title,
      date: store.state.workout.wodRegistration.date,
      type: store.state.workout.wodRegistration.type,
      set: store.state.workout.wodRegistration.set,
      round: store.state.workout.wodRegistration.round,
      timeCap: store.state.workout.wodRegistration.timeCap,
      movements: store.state.workout.wodRegistration.movements,
      customMovements: store.state.workout.wodRegistration.customMovements,
      description: store.state.workout.wodRegistration.description,
    })
    watch(() => wodRegistration.type, (newValue) => {
      if (newValue === 'Custom') {
        isCustomize.value = true
      } else {
        isCustomize.value = false
      }
    })

    const watchMapping = {
      title: 'updateWodTitle',
      date: 'updateWodDate',
      type: 'updateWodType',
      set: 'updateWodSet',
      round: 'updateWodRound',
      timeCap: 'updateWodTimeCap',
      customMovements: 'updateWodCustomMovements',
      description: 'updateWodDescription',
    }

    for (let key in watchMapping) {
      watch(() => wodRegistration[key], (newValue) => {
        store.commit(watchMapping[key], newValue);
      });
    }

    const handleTypeChange = () => {
      wodRegistration.round = 0
      wodRegistration.timeCap = 0
      wodRegistration.customMovements = ""
    }

    const handleSetTypeChange = () => {
      wodRegistration.set = 0
    }

    const addMovement = () => {
      wodRegistration.movements.push({
        name: "",
        measure: "",
        type: "",
        levelSetting: [],
        description: "",
      })
    }
    const addRest = () => {
      wodRegistration.movements.push({
        name: "Rest",
        measure: "",
        type: "Sec",
        levelSetting: [],
        description: "",
      })
    }
    const saveWod = () => {
      store.dispatch("addWod")
        .then(() => {
          console.log("success")
        })
        .catch((error) => {
          console.log(error)
        })
    }
    return {
      isSetType,
      isCustomize,
      wodRegistration,
      handleTypeChange,
      handleSetTypeChange,
      addMovement,
      addRest,
      saveWod,
    }
  },
})
</script>

<style scoped lang="scss">

</style>
