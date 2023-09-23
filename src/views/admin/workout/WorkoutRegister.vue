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
                />
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">WOD 일자</CInputGroupText>
                <CButton>
                  <DatePicker v-model="workoutDate"/>
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCol sm="7">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">Workout 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="workoutType">
                  <option>타입 선택</option>
                  <option value="ForTime">ForTime</option>
                  <option value="AMRAP">AMRAP</option>
                  <option value="EMOM">EMOM</option>
                  <option value="Tabata">Tabata</option>
                </CFormSelect>
              </CInputGroup>
            </CCol>
            <CCol sm="2">
              <div style="height: 8px;"></div>
              <CFormCheck id="setType" label="세트 운동" v-model="isSetType"/>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3" v-if="isSetType">
                <CInputGroupText id="basic-addon3">세트 수</CInputGroupText>
                <CFormInput type="number" id="setCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === 'ForTime'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === 'AMRAP'">
            <CCol sm="3" />
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === 'EMOM'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === 'Tabata'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow>
            <CCard>
              <CCardHeader color="danger">
                Movements
                <div class="float-end">
                  <CButton
                    color="warning" class="position-relative" size="sm">
                    휴식 추가
                  </CButton>
                  <CButton
                    color="info" class="position-relative" size="sm">
                    동작 추가
                  </CButton>
                </div>
              </CCardHeader>
              <CCardBody>
                <MovementCard/>
              </CCardBody>
            </CCard>
          </CRow>
        </CCardBody>
        <CCardFooter>
          <div class="float-end">
            <CButton
              color="success" class="position-relative" size="md">
              저장
            </CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
</template>

<script>
import { defineComponent, ref } from 'vue'
import MovementCard from "@/views/admin/movement/MovementCard.vue"
import DatePicker from "vue3-datepicker"

export default defineComponent({
  components: {DatePicker, MovementCard},
  setup(props, {emit}) {
    const isSetType = ref(false)
    const workoutType = ref('')
    const workoutDate = ref('')
    return {
      isSetType,
      workoutType,
      workoutDate,
    }
  },
})
</script>

<style scoped lang="scss">

</style>
