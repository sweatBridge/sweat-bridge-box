<template>
  <EasyDataTable
    :headers="headers"
    :items="feedbacks"
    table-class-name="customize-table"
    body-text-direction="center"
    header-text-direction="center"
    buttons-pagination
    :rows-per-page="5"
  >
    <template #item-name="{ name }">
      {{name}}
    </template>
    <template #item-feedback="{ feedback }">
      {{feedback}}
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

</template>

<script>
export default {
  name: "MemberFeedback",
  components: {},
  props: {
    feedbacks: {
      type: Object,
      required: true,
    }
  },
  setup() {
    const headers = [
      { text: "이름", value: "name", width: "80" },
      { text: "피드백", value: "feedback" },
    ]

    return {
      headers,
    }
  }
}
</script>

<style scoped>
.customize-table {
  /*--easy-table-header-background-color: #53651e;*/
  /*--easy-table-header-font-color: rgba(255, 255, 255, 0.38);*/
}

</style>
