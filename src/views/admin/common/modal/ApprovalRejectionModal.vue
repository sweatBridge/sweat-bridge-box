<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>요청 거절</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <strong>{{name}}</strong> 님을 거부하시겠습니까?
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="cancel">
        취소
      </CButton>
      <CButton color="warning" @click="reject">
        거절
      </CButton>
    </CModalFooter>
  </CModal>

</template>

<script>
import {reactive, ref} from "vue"
import {useStore} from "vuex"

export default {
  name: "ApprovalRejectionModal",
  setup(props, { emit }) {
    const store = useStore()
    const modalStatus = ref(false)
    const name = ref("")
    const member = reactive({})
    const showModal = (user) => {
      modalStatus.value = true
      name.value = user.name
      member.value = user
    }
    const reject = () => {
      modalStatus.value = false
      member.value.box = "CFBD"
      store.dispatch("rejectMember", member.value)
    }
    const cancel = () => {
      modalStatus.value = false
    }
    return {
      modalStatus,
      member,
      name,
      showModal,
      reject,
      cancel
    }
  }
}

</script>

<style scoped>
.modal-title {
  color: var(--cui-white)
}
.modal-header {
  background-color: var(--cui-warning);
}
</style>
