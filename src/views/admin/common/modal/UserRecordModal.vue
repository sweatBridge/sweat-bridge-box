<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    size="xl"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>기록 모아보기</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <member-record :records="records"/>
    </CModalBody>
  </CModal>

</template>

<script>
import {useStore} from "vuex";
import {computed, ref} from "vue";
import MemberRecord from "@/views/admin/workout/MemberRecord.vue";

export default {
  name: "UserRecordModal",
  components: {MemberRecord},
  setup() {
    const store = useStore()
    const modalStatus = ref(false)
    const toastMessageRef = ref(null)
    const records = computed(() => store.state.workout.registeredWod.records || [])
    const showModal = () => {
      modalStatus.value = true
    }
    const cancel = () => {
      modalStatus.value = false
    }

    return {
      modalStatus,
      toastMessageRef,
      records,
      showModal,
      cancel,
    }
  },
}
</script>

<style scoped>

</style>
