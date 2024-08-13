<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader>
      <CModalTitle>만료 일자 갱신</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CRow>
        <CCol :sm="3">
          이름 :
        </CCol>
        <CCol>
          {{member.name}}
        </CCol>
      </CRow>
      <CRow>
        <CCol :sm="3">
          만료 일자 :
        </CCol>
        <CCol>
          {{member.expiryDate}}
        </CCol>
      </CRow>
      <CRow>
        <CCol :sm="3">
          갱신 일자 :
        </CCol>
        <CCol>
          <DatePicker v-model="updatedExpiryDate"/>
        </CCol>
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger">
        취소
      </CButton>
      <CButton color="success">
        저장
      </CButton>
    </CModalFooter>
  </CModal>

</template>
<script>
import { ref } from "vue"
import DatePicker from "vue3-datepicker"

export default {
name: "UpdateExpiryDateModal",
  components: {
    DatePicker
  },
  props: {
    member: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const modalStatus = ref(false)
    const showModal = () => {
      console.log("modal")
      console.log(props.member)
      modalStatus.value = true
    }
    const checkUpdateExpiryDateModal = () => {
      modalStatus.value = false
      console.log(props.member)
    }
    const updatedExpiryDate = ref("")
    return {
      modalStatus,
      showModal,
      checkUpdateExpiryDateModal,
      updatedExpiryDate
    }
  }
}
</script>

<!--<script setup>-->
<!--import { ref } from "vue"-->
<!--import DatePicker from "vue3-datepicker";-->

<!--const modalStatus = ref(false)-->
<!--const props = defineProps({-->
<!--  member: {-->
<!--    type: Object,-->
<!--    required: true-->
<!--  }-->
<!--})-->
<!--const showModal = () => {-->
<!--  modalStatus.value = true-->
<!--}-->
<!--const checkUpdateExpiryDateModal = () => {-->
<!--  modalStatus.value = false-->
<!--  console.log(props.member)-->
<!--}-->
<!--</script>-->

<style scoped>

</style>
