<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 추가</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <strong>{{name}}</strong> 님을 추가하시겠습니까?
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="cancel">
        취소
      </CButton>
      <CButton color="success" @click="addMember">
        확인
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
    // addType is either 'auto' or 'manual'
    const addType = ref("auto")
    const toastMessageRef = ref(null)
    const boxName = ref(localStorage.getItem('boxName') || '');
    
    const showModal = (user, type) => {
      modalStatus.value = true
      name.value = user.realName
      addType.value = type
      member.value = user
    }
    
    const addMember = async () => {
      try {
        // 1. register box (add boxName field)
        member.value.boxName = boxName.value;

        // 2. update user doc
        // if addType is 'auto', update the user doc
        if (addType.value === 'auto') {
          await store.dispatch("updateUser", member.value);
        }

        // 3. create member doc
        await store.dispatch("createMember", member.value);

        toastMessageRef.value.createToast(
          {
            title: '성공',
            content: '회원 추가 성공',
            type: 'success'
          }
        )
        setTimeout(() => {
          location.reload()
        }, 500);
      } catch (error) {
        toastMessageRef.value.createToast(
          {
            title: '실패',
            content: '회원 추가 실패' + error,
            type: 'danger'
          }
        )
      }
    }

    const approve = () => {
      modalStatus.value = false
      member.value.box = boxName.value
      store.dispatch("approveMember", member.value)
        .then(() => {
          toastMessageRef.value.createToast(
            {
              title: '성공',
              content: '회원 추가가 성공.',
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
              content: '회원 추가가 실패',
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
      addMember,
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
