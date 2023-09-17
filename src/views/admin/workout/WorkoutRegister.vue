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
                <CInputGroupText id="basic-addon3">Workout 타입</CInputGroupText>
                <CFormSelect id="inputGroupSelect01" v-model="workoutType">
                  <option>타입 선택</option>
                  <option value="1">ForTime</option>
                  <option value="2">AMRAP</option>
                  <option value="3">EMOM</option>
                  <option value="4">Tabata</option>
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
          <CRow v-if="workoutType === '1'">
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
          <CRow v-if="workoutType === '2'">
            <CCol sm="3" />
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">시간 제한</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === '3'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
          <CRow v-if="workoutType === '4'">
            <CCol sm="3">
              <CInputGroup class="mb-3">
                <CInputGroupText id="basic-addon3">라운드 수</CInputGroupText>
                <CFormInput type="number" id="roundCount" aria-describedby="basic-addon3"/>
              </CInputGroup>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup(props, {emit}) {
    const isSetType = ref(false)
    const workoutType = ref('')
    return {
      isSetType,
      workoutType
    }
  },
})
</script>

<style scoped lang="scss"></style>
