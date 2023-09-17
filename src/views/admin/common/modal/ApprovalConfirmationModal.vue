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

<script setup>
import { ref } from "vue"

const modalStatus = ref(false)
const showModal = () => {
  modalStatus.value = true
}


</script>

<style scoped>

</style>
