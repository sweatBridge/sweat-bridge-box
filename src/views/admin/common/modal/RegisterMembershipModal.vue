<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
  >
    <CModalHeader>
      <CModalTitle>회원권 등록(갱신)</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText>이름</CInputGroupText>
          <CFormInput v-model="member.value.name" readonly/>
        </CInputGroup>
        <CInputGroup class="mb-3">
          <CInputGroupText>기존 만료일</CInputGroupText>
          <CFormInput :value="getExpiryDateStr(member.value.expiryDate)" readonly/>
        </CInputGroup>
        <CInputGroup class="mb-3">
          <CInputGroupText>등록 타입</CInputGroupText>
          <CFormSelect v-model="registrationType" @change="handleTypeChange">
            <option>등록 타입 선택</option>
            <option value="PeriodPass">기간권</option>
            <option value="CountPass">횟수권</option>
          </CFormSelect>
        </CInputGroup>
      </CRow>
      <CRow v-if="registrationType === 'PeriodPass'">
        <CInputGroup class="mb-3">
          <CInputGroupText>갱신 만료일</CInputGroupText>
          <CButton style="display: flex; align-items: center;">
            <CIcon name="cil-calendar" style="margin-right: 8px;"/>
            <DatePicker v-model="expiryDate"/>
          </CButton>
        </CInputGroup>
      </CRow>
      <CRow v-if="registrationType === 'CountPass'">
        <CInputGroup class="mb-3">
          <CInputGroupText>만료일</CInputGroupText>
          <CButton style="display: flex; align-items: center;">
            <CIcon name="cil-calendar" style="margin-right: 8px;"/>
            <DatePicker v-model="expiryDate"/>
          </CButton>
          <CInputGroupText>횟수</CInputGroupText>
          <CFormInput v-model="remainingVisits" />
        </CInputGroup>
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="() => {modalStatus = false}">
        취소
      </CButton>
      <CButton color="success" @click="register">
        저장
      </CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import { ref, reactive } from "vue"
import { useStore } from "vuex"
import DatePicker from "vue3-datepicker"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"
import {convertTimestampToString} from "@/views/admin/util/member";

export default {
  name: "RegisterMembershipModal",
  components: {
    DatePicker,
    ToastMessage
  },
  setup(props, { emit }) {
    const store = useStore()
    const modalStatus = ref(false)
    const member = reactive({})
    const registrationType = ref("")
    const expiryDate = ref(new Date())
    const remainingVisits = ref(0)
    const toastMessageRef = ref(null)
    const showModal = (user) => {
      member.value = user
      modalStatus.value = true
    }

    const getExpiryDateStr = (timestamp) => {
      return convertTimestampToString(timestamp)
    }

    const handleTypeChange = () => {
      expiryDate.value = new Date()
      remainingVisits.value = 0
    }

    const register = () => {
      member.value.box = "CFBD"
      member.value.type = registrationType.value
      member.value.expiryDate = expiryDate.value
      member.value.remainingVisits = remainingVisits.value
      store.dispatch("registerMembership", member.value)
        .then(() => {
          toastMessageRef.value.createToast(
            {
              title: '성공',
              content: '회원권 등록 성공.',
              type: 'success'
            }
          )
          setTimeout(() => {
            location.reload()
          }, 1000)
        })
        .catch(error => {
          console.error("An error occurred while rejecting the member:", error)
          toastMessageRef.value.createToast(
            {
              title: '실패',
              content: '회원권 등록 실패 error: ' + error.message,
              type: 'danger'
            }
          )
          setTimeout(() => {
            location.reload()
          }, 1000)
        })
      modalStatus.value = false
    }
    return {
      modalStatus,
      member,
      registrationType,
      expiryDate,
      remainingVisits,
      toastMessageRef,
      showModal,
      getExpiryDateStr,
      handleTypeChange,
      register,
    }
  }
}
</script>

<style scoped>

</style>
