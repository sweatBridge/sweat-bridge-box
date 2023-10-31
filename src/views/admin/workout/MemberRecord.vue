<template>
  Level :
  <input type="text" v-model="searchValue">
  <br>
  <br>
  <EasyDataTable
    :headers="headers"
    :items="records"
    search-field="level"
    :search-value="searchValue"
    table-class-name="customize-table"
    body-text-direction="center"
    header-text-direction="center"
    buttons-pagination
    :rows-per-page="5"
  >
    <template #item-name="{ name }">
      {{name}}
    </template>
    <template #item-level="{ level }">
      {{level}}
    </template>
    <template #item-score="{ score }">
      {{score}}
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
import {ref} from "vue";

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
      { text: "난이도", value: "level", sortable: true },
      { text: "기록", value: "score", sortable: true },
      { text: "상세", value: "detail" },
    ]

    const searchValue = ref('')

    return {
      headers,
      searchValue,
    }
  }
}
</script>

<style scoped>
.customize-table {
  /*--easy-table-header-item-padding: 1px;*/
  /*--easy-table-header-font-size: 10px;*/
  /*--easy-table-header-height: 5px;*/
}

</style>
