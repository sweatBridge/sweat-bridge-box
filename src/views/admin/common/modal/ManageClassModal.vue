<template>
  <CModal
    :visible="modalStatus"
    @close="( ) => { modalStatus = false }"
    backdrop="static"
    >
    <CModalHeader>
      <CModalTitle>수업 관리</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">시작 시각</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="startStr"
          readonly
        />
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">종료 시각</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="endStr"
          readonly
        />
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">코치</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="coach"
        />
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">정원</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="capacity"
        />
      </CInputGroup>
    </CModalBody>
    <CModalFooter class="d-flex justify-content-between">
      <CButton color="danger" @click="checkDeleteModalResult()">
        삭제
      </CButton>
      <CButton color="success" @click="checkUpdateModalResult()">
        변경
      </CButton>
    </CModalFooter>

  </CModal>

</template>

<script>
import {ref, defineComponent} from "vue"
import {extractDateTimeFromDocKey} from "@/views/admin/class/classCalendarUtils";

export default defineComponent({
  setup(props, {emit}) {
    const modalStatus = ref(false)
    const id = ref('')
    const startStr = ref('')
    const endStr = ref('')
    const coach = ref('')
    const capacity = ref(0)
    const reserved = ref([])
    // const emit = defineEmits(
    //   ['updateModalResult', 'deleteModalResult']
    // )

    const showModal = (event) => {
      modalStatus.value = true
      const {year, month, day, startHour, startMin, endHour, endMin} = extractDateTimeFromDocKey(event.id)
      startStr.value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour}:${startMin}:00+09:00`
      endStr.value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour}:${endMin}:00+09:00`
      id.value = event.id
      coach.value = event.extendedProps.coach
      capacity.value = event.extendedProps.cap
      reserved.value = event.extendedProps.reserved
    }

    const checkUpdateModalResult = () => {
      let result = {
        id: id.value,
        startStr: startStr.value,
        endStr: endStr.value,
        coach: coach.value,
        capacity: capacity.value,
        reserved: reserved.value
      }
      emit('updateModalResult', result)
      modalStatus.value = false
    }

    const checkDeleteModalResult = () => {
      let result = {
        id: id.value
      }
      emit('deleteModalResult', result)
      modalStatus.value = false
    }

    return {
      modalStatus,
      startStr,
      endStr,
      coach,
      capacity,
      emit,
      showModal,
      checkUpdateModalResult,
      checkDeleteModalResult
    }
  }
})
</script>

<!--<script setup>-->
<!--import {ref, reactive} from "vue"-->
<!--const modalStatus = ref(false)-->
<!--const props = defineProps({-->
<!--  id: String,-->
<!--  startStr: String,-->
<!--  endStr: String,-->
<!--  coach: String,-->
<!--  capacity: Number,-->
<!--})-->
<!--const emit = defineEmits(-->
<!--  ['updateModalResult', 'deleteModalResult']-->
<!--)-->

<!--const showModalRef = ref(showModal);-->

<!--function showModal() {-->
<!--  modalStatus.value = true;-->
<!--}-->

<!--const checkUpdateModalResult = () => {-->
<!--  let result = {-->
<!--    id: this.props.id,-->
<!--    startStr: this.props.startStr,-->
<!--    endStr: this.props.endStr,-->
<!--    coach: this.props.coach,-->
<!--    capacity: this.props.capacity,-->
<!--  }-->
<!--  modalStatus.value = false-->
<!--  emit('updateModalResult', result)-->
<!--}-->

<!--const checkDeleteModalResult = () => {-->
<!--  let result = {-->
<!--    id: this.props.id-->
<!--  }-->
<!--  modalStatus.value = false-->
<!--  emit('deleteModalResult', result)-->
<!--}-->

<!--</script>-->

<style scoped>

</style>
