<template>
  <CModal
    :visible="modalStatus"
    backdrop="static"
    @close="() => {modalStatus = false}"
    size="lg"
  >
    <CModalHeader class="modal-header">
      <div class="d-flex justify-content-between align-items-center w-100">
        <CModalTitle>예약 인원</CModalTitle>
        <CButton color="dark" shape="rounded-pill" @click="addMemberToClass">
          직접 추가하기
        </CButton>
      </div>
    </CModalHeader>
    <CModalBody>
      <EasyDataTable
        :headers="headers"
        :items="members"
        body-text-direction="center"
        header-text-direction="center"
        buttons-pagination
        :rows-per-page="5"
      >
        <template #item-realName="{ realName }">
          {{realName}}
        </template>
        <template #item-nickName="{ nickName }">
          {{nickName}}
        </template>
        <template #item-email="{ email }">
          {{email}}
        </template>
        <template #item-deleteAction="{ email }">
          <CButton color="danger" @click="deleteMemberFromClass(email)">
            X
          </CButton>
        </template>
      </EasyDataTable>
    </CModalBody>
  </CModal>
  <add-reserve-member-modal :classmembers="members" ref="addReserveMemberModalRef"/>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import {useStore} from "vuex";
import {ref} from "vue";
import AddReserveMemberModal from "./AddReserveMemberModal.vue";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "ReservedMemberModal",
  components: {AddReserveMemberModal, ToastMessage},
  props: {
    members: {
      type: Array,
      required: true,
    },
  },
  setup() {
    const boxName = localStorage.getItem('boxName');
    const toastMessageRef = ref(null)
    const addReserveMemberModalRef = ref(null)
    const start = ref('')
    const selectedclass = ref('')
    const headers = [
      { text: "이름", value: "realName", width: "60" },
      { text: "닉네임", value: "nickName", width: "60" },
      { text: "이메일", value: "email", width: "80"},
      { text: "삭제", value: "deleteAction", width: "10"}
    ]
    const store = useStore()
    const modalStatus = ref(false)

    const showModal = (id, time) => {
      selectedclass.value = id,
      start.value = time,
      modalStatus.value = true
    }

    const cancel = () => {
      modalStatus.value = false
    }

    const addMemberToClass = () => {
      addReserveMemberModalRef.value.showModal(
        selectedclass.value,
        start.value,
      )
    }

    const deleteMemberFromClass = async (email) => {
      try{
        await store.dispatch("findMembership", {
          email: email, 
          classId: selectedclass.value, 
          box: boxName, 
          isCreate: false
        })
        toastMessageRef.value.createToast({
          title: "성공",
          content: "회원을 삭제했습니다.",
          type: "success"
        })
        setTimeout(() => location.reload(), 500)
      } catch(error){
        toastMessageRef.value.createToast({
          title: "실패",
          content: "회원 삭제 실패: " + error,
          type: "danger"
        })
      }
    }

    return {
      headers,
      modalStatus,
      addReserveMemberModalRef,
      toastMessageRef,
      showModal,
      cancel,
      addMemberToClass,
      deleteMemberFromClass,
    }
  },
}
</script>

<style scoped>
.customize-table {
  /*--easy-table-header-background-color: #53651e;*/
  /*--easy-table-header-font-color: rgba(255, 255, 255, 0.38);*/
}

</style>
