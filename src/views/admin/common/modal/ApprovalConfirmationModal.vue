<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>요청 승인</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <strong>{{name}}</strong> 님 요청을 승인하시겠습니까?
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="cancel">
        취소
      </CButton>
      <CButton color="success" @click="approve">
        승인
      </CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />

</template>

<script>
import {reactive, ref} from "vue"
import {useStore} from "vuex"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "ApprovalConfirmationModal",
  components: {ToastMessage},
  setup(props, { emit }) {
    const store = useStore()
    const modalStatus = ref(false)
    const name = ref("")
    const member = reactive({})
    const toastMessageRef = ref(null)
    const boxName = ref(localStorage.getItem('boxName') || '');
    
    const showModal = (user) => {
      modalStatus.value = true
      name.value = user.realName
      member.value = user
    }
    const approve = () => {
      modalStatus.value = false
      member.value.box = boxName.value
      store.dispatch("approveMember", member.value)
        .then(() => {
          toastMessageRef.value.createToast(
            {
              title: '성공',
              content: '요청 승인 성공.',
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
              content: '요청 승인 실패',
              type: 'danger'
            }
          )
          setTimeout(() => {
            location.reload()
          }, 500)
        })
    }
    const cancel = () => {
      modalStatus.value = false
    }
    return {
      modalStatus,
      member,
      name,
      toastMessageRef,
      showModal,
      approve,
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
