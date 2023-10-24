<template>
  <CModal
    class="close"
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>승인 요청</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <EasyDataTable
        :headers="headers"
        :items="pendingMembers"
        show-index
        body-text-direction="center"
        header-text-direction="center"
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-gender="{ gender }">
          {{gender}}
        </template>
        <template #item-age="{ birthDate }">
          {{getAge(birthDate)}}
        </template>
        <template #item-phone="{ phone }">
          {{phone}}
        </template>
        <template #item-operation="{ index }">
          <CButton
            color="danger"
            size="sm"
            @click="rejectMember(index)"
          >
            <CIcon name="cil-x-circle" />
          </CButton>
          <CButton
            color="dark"
            size="sm"
            @click="approveMember(index)"
          >
            <CIcon name="cil-check-circle" />
          </CButton>
        </template>

      </EasyDataTable>
    </CModalBody>
  </CModal>
  <approval-confirmation-modal ref="approvalConfirmationModal" />
  <approval-rejection-modal ref="approvalRejectionModal" />
</template>

<script>

import {ref, onMounted, computed} from "vue"
import { useStore } from "vuex"
import {calculateAge} from "@/views/admin/util/member"
import ApprovalConfirmationModal from "@/views/admin/common/modal/ApprovalConfirmationModal.vue";
import ApprovalRejectionModal from "@/views/admin/common/modal/ApprovalRejectionModal.vue";

export default {
  components: {ApprovalRejectionModal, ApprovalConfirmationModal},
  setup(props, { emit }) {
    const store = useStore()
    const pendingMembers = computed(() => store.state.member.pendingMembers)
    const headers = [
      { text: "이름", value: "name" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "연락처", value: "phone" },
      { text: "거절/수락", value: "operation", width: "100" }
    ]

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const modalStatus = ref(false)
    const showModal = () => {
      modalStatus.value = true
    }
    const checkApprovalRequestModal = (result) => {
      modalStatus.value = false
      emit('approvalRequestModalResult', result)
    }
    return {
      headers,
      pendingMembers,
      getAge,
      modalStatus,
      showModal,
      checkApprovalRequestModal,
    }
  },
  methods: {
    approveMember(index) {
      const member = this.pendingMembers[index - 1]
      this.$refs.approvalConfirmationModal.showModal(member)
    },
    rejectMember(index) {
      const member = this.pendingMembers[index - 1]
      this.$refs.approvalRejectionModal.showModal(member)
    }
  }
}
</script>

<style scoped>
.modal-header {
  background-color: var(--cui-info)
}
.modal-title {
  color: var(--cui-white)
}
</style>
