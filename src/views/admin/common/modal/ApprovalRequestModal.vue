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
        :items="pendingMembers"
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

import {ref, onMounted, computed} from "vue"
import { useStore } from "vuex"
import {calculateAge} from "@/views/admin/util/member"

export default {
  components: {},
  setup(props, { emit }) {
    const store = useStore()
    const pendingMembers = computed(() => store.state.member.pendingMembers)
    const headers = [
      { text: "이름", value: "name" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "연락처", value: "phone" },
      { text: "수락/거절", value: "operation", width: "100" }
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
  }
}
</script>

<style scoped>

</style>
