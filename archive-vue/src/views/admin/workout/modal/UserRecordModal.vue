<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    size="xl"
    :backdrop="'static'"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>기록 모아보기</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="d-flex justify-content-end mb-3">
        <CButton color="black" class="position-relative header-button" size="sm" @click="showRegisterModal">
          기록 추가
        </CButton>
      </div>
      <member-record :records="records" :is-modal="true"/>
    </CModalBody>
  </CModal>
  <register-user-record-modal ref="registerUserRecordModalRef" />
</template>

<script>
import {useStore} from "vuex";
import {computed, ref} from "vue";
import MemberRecord from "@/views/admin/workout/MemberRecord.vue";
import RegisterUserRecordModal from "@/views/admin/workout/modal/RegisterUserRecordModal.vue";

export default {
  name: "UserRecordModal",
  components: {
    MemberRecord,
    RegisterUserRecordModal
  },
  setup() {
    const store = useStore()
    const modalStatus = ref(false)
    const registerUserRecordModalRef = ref(null)
    const records = computed(() => store.state.workout.registeredWod.records || [])
    const currentWodId = ref(null)

    const showModal = (wodId) => {
      currentWodId.value = wodId
      modalStatus.value = true
    }

    const showRegisterModal = () => {
      registerUserRecordModalRef.value.showModal(currentWodId.value)
    }

    return {
      modalStatus,
      records,
      showModal,
      showRegisterModal,
      registerUserRecordModalRef,
      currentWodId
    }
  }
}
</script>

<style scoped>
.modal-header {
  background-color: rgb(148, 167, 226);
  color: #ffffff;
}
.header-button {
  background-color: #e7e6fe;
  color: rgb(70, 100, 200)
}
</style>
