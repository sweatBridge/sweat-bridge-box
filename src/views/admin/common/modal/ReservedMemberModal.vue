<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    backdrop="static"
    size="sm"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>예약 인원</CModalTitle>
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
        <template #item-name="{ name }">
          {{name}}
        </template>
      </EasyDataTable>
    </CModalBody>
  </CModal>


</template>

<script>
import {useStore} from "vuex";
import {ref} from "vue";

export default {
  name: "ReservedMemberModal",
  components: {},
  props: {
    members: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const headers = [
      { text: "이름", value: "name", width: "80" },
    ]
    const store = useStore()
    const modalStatus = ref(false)
    const showModal = () => {
      modalStatus.value = true
    }
    const cancel = () => {
      modalStatus.value = false
    }

    return {
      headers,
      modalStatus,
      showModal,
      cancel,
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
