<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
    size="xl"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>와드 수정</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <registered-workout/>
    </CModalBody>
<!--    <CModalFooter>-->
<!--      <CButton color="secondary" @click="cancel" size="sm">-->
<!--        취소-->
<!--      </CButton>-->
<!--    </CModalFooter>-->
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import {ref} from "vue"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import RegisteredWorkout from "@/views/admin/workout/RegisteredWorkout.vue";

export default {
  name: "WorkoutModifyModal",
  components: {RegisteredWorkout, ToastMessage},
  setup() {
    const modalStatus = ref(false)
    const toastMessageRef = ref(null)
    const showModal = () => {
      modalStatus.value = true
    }
    const cancel = () => {
      modalStatus.value = false
    }

    return {
      modalStatus,
      name,
      toastMessageRef,
      showModal,
      cancel,
    }
  },
}
</script>

<style scoped>

</style>
