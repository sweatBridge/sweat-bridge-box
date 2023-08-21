<template>
  <CModal
    :visible="modalStatus"
    @close="
      () => {
        modalStatus = false
      }
    "
    backdrop="static"
  >
    <CModalHeader>
      <CModalTitle>승인 요청</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <EasyDataTable
        :headers="headers"
        :items="items"
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-gender="{ gender }">
          {{gender}}
        </template>
        <template #item-age="{ age }">
          {{age}}
        </template>
        <template #item-phone="{ phone }">
          {{phone}}
        </template>
        <template #item-operation="">
          <CButton
            color="danger"
            size="sm"
          >
            <CIcon name="cil-ban" />
          </CButton>
          <CButton
            color="success"
            size="sm"
          >
            <CIcon name="cil-check" />
          </CButton>
        </template>

      </EasyDataTable>
    </CModalBody>
  </CModal>


</template>

<script>

import { ref } from "vue"

export default {
  components: {},
  setup(props, { emit }) {
    const headers = [
      { text: "이름", value: "name" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "연락처", value: "phone" },
      { text: "수락/거절", value: "operation", width: "100" }
    ]

    const modalStatus = ref(false)
    const showModal = () => {
      modalStatus.value = true
    }
    const checkApprovalRequestModal = (result) => {
      modalStatus.value = false
      emit('approvalRequestModalResult', result)
    }
    const items = [
      {
        name: '김대현',
        duration: 30,
        gender: '남',
        age: 28,
        weight: 80,
        height: 180,
        phone: "010-1234-5678",
        purpose: '다이어트',
      },
    ]
    return {
      headers,
      items,
      modalStatus,
      showModal,
      checkApprovalRequestModal,
    }
  }
}
</script>

<style scoped>

</style>
