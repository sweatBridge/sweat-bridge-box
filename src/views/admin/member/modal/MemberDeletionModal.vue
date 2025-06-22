<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 탈퇴</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <strong>{{name}}</strong> 님을 탈퇴시키시겠습니까?
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="cancel">
        취소
      </CButton>
      <CButton color="warning" @click="withdraw">
        탈퇴
      </CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />

</template>

<script>
import {reactive, ref} from "vue"
import {useStore} from "vuex"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";

export default {
  name: "MemberDeletionModal",
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
    const withdraw = () => {
      modalStatus.value = false
      member.value.box = boxName.value
      store.dispatch("withdrawMember", member.value)
        .then(() => {
          toastMessageRef.value.createToast({
            title: '성공',
            content: '요청 거부 성공.',
            type: 'success'
          })
          setTimeout(() => location.reload(), 1000)
        })
        .catch(error => {
          toastMessageRef.value.createToast({
            title: '실패',
            content: '회원 탈퇴 실패',
            type: 'danger'
          })
          setTimeout(() => location.reload(), 500)
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
      withdraw,
      cancel,
    }
  },
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
