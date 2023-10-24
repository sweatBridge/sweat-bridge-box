<template>
  <EasyDataTable
    :headers="headers"
    :items="records"
    table-class-name="customize-table"
    body-text-direction="center"
    header-text-direction="center"
  >
    <template #item-name="{ name }">
      {{name}}
    </template>
    <template #item-level="{ level }">
      {{level}}
    </template>
    <template #item-record="{ record }">
      {{record}}
    </template>
    <template #item-detail="">
      <CButton
        color="light"
        size="sm"
      >
        <CIcon name="cil-notes" />
      </CButton>
    </template>
  </EasyDataTable>

</template>

<script>
export default {
  name: "MemberRecord",
  components: {},
  props: {
    records: {
      type: Object,
      required: true,
    }
  },
  setup() {
    const headers = [
      { text: "이름", value: "name", width: "80" },
      { text: "난이도", value: "level" },
      { text: "기록", value: "record" },
      { text: "상세", value: "detail" },
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
