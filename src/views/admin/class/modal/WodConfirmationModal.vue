<template>
  <CModal
    :visible="modalStatus"
    backdrop="static"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>와드에 회원 추가</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <strong>{{ name }}</strong> 님을 추가하시겠습니까?
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="cancel">취소</CButton>
      <CButton color="success" @click="addMember">확인</CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import { ref, reactive } from "vue"
import { useStore } from "vuex"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "ApprovalConfirmationModal",
  components: { ToastMessage },
  setup(props, { emit }) {
    const store = useStore()
    const modalStatus = ref(false)
    const name = ref("")
    const member = reactive({})
    const toastMessageRef = ref(null)
    const classId = ref("")
    const date = ref("")

    const showModal = (target, selectedClass, classDate) => {
      member.value = target
      name.value = member.value.realName
      modalStatus.value = true
      classId.value = selectedClass
      date.value = classDate
    }

    const addMember = async () => {
      try {
        // Perform reservation or cancellation (automated handling)
        await store.dispatch("findMembership", {
          email: member.value.email,
          classId: classId.value,
          box: member.value.boxName,
          isCreate: true
        })

        toastMessageRef.value.createToast({
          title: "성공",
          content: "회원 추가 성공",
          type: "success"
        })

        setTimeout(() => location.reload(), 500)
      } catch (error) {
        toastMessageRef.value.createToast({
          title: "실패",
          content: "회원 추가 실패: " + error,
          type: "danger"
        })
      }
    }

    const cancel = () => {
      modalStatus.value = false
    }

    return {
      modalStatus,
      name,
      toastMessageRef,
      showModal,
      addMember,
      cancel
    }
  }
}
</script>

<style scoped>
.modal-title {
  color: var(--cui-white);
}
.modal-header {
  background-color: var(--cui-warning);
}
</style>
