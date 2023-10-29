<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
    size="xl"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>피드백 모아보기</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <member-feedback :feedbacks="feedbacks" rows-per-page="25"/>
    </CModalBody>
  </CModal>
</template>

<script>
import {computed, ref} from "vue";
import MemberFeedback from "@/views/admin/workout/MemberFeedback.vue";
import {useStore} from "vuex";

export default {
  name: "UserFeedbackModal",
  components: {MemberFeedback},
  setup() {
    const store = useStore()
    const modalStatus = ref(false)
    const toastMessageRef = ref(null)
    const feedbacks = computed(() => store.state.record.records)
    const showModal = () => {
      modalStatus.value = true
    }
    const cancel = () => {
      modalStatus.value = false
    }

    return {
      modalStatus,
      toastMessageRef,
      feedbacks,
      showModal,
      cancel,
    }
  },
}
</script>

<style scoped>

</style>
