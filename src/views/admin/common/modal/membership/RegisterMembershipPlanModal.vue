<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader>
      <CModalTitle>멤버십(회원권) 플랜</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CRow>
        <CInputGroup class="mb-3">
          <CInputGroupText>플랜 이름</CInputGroupText>
          <CFormInput v-model="plan"/>
        </CInputGroup>
        <CInputGroup class="mb-3">
          <CInputGroupText>회원권 타입</CInputGroupText>
          <CFormSelect v-model="membershipType" @change="handleTypeChange">
            <option>등록 타입 선택</option>
            <option value="periodPass">기간권</option>
            <option value="countPass">횟수권</option>
          </CFormSelect>
        </CInputGroup>
      </CRow>
      <CRow v-if="membershipType === 'periodPass'">
        <CInputGroup class="mb-3">
          <CInputGroupText>기간(일)</CInputGroupText>
          <CFormInput v-model="duration" />
        </CInputGroup>
      </CRow>
      <CRow v-if="membershipType === 'countPass'">
        <CInputGroup class="mb-3">
          <CInputGroupText>기간(일)</CInputGroupText>
          <CFormInput v-model="duration" />
          <CInputGroupText>횟수</CInputGroupText>
          <CFormInput v-model="count" />
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
import { ref } from "vue"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "RegisterMembershipPlanModal",
  components: {
    ToastMessage
  },
  setup(props, { emit }) {
    // const store = useStore()
    const modalStatus = ref(false)
    const plan = ref("")
    const membershipType = ref("")
    const count = ref(0)
    const duration = ref(0)

    const showModal = (user) => {
      modalStatus.value = true
    }

    const handleTypeChange = () => {
      duration.value = 0
      count.value = 0
    }

    const register = () => {
      console.log(plan.value)
      console.log(membershipType.value)
      console.log(count.value)
      console.log(duration.value)
      modalStatus.value = false
    }
    return {
      modalStatus,
      plan,
      membershipType,
      count,
      duration,
      showModal,
      handleTypeChange,
      register
    }
  }
}
</script>

<style scoped>

</style>
