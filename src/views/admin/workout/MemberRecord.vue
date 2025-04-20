<template>
  <CBadge class="p-lg-2 header-button">
    <strong>이름</strong>
  </CBadge>
  :
  <input type="text" v-model="searchValue">
  <br>
  <br>
  <EasyDataTable
    :headers="headers"
    :items="filteredRecords"
    search-field="realName"
    :search-value="searchValue"
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
    <template #item-gender="{ gender }">
      {{gender}}
    </template>
    <template #item-isRxd="{ isRxd }">
      {{isRxd ? 'Rxd' : 'Scaled'}}
    </template>
    <template #item-score="{ score }">
      {{score}}
    </template>
  </EasyDataTable>
</template>

<script>
import {ref, computed} from "vue";
import {useStore} from "vuex";

export default {
  name: "MemberRecord",
  components: {},
  setup() {
    const store = useStore();
    const searchValue = ref('');
    
    const records = computed(() => {
      const wodRecords = store.state.workout.registeredWod.records || [];
      return wodRecords.map(record => ({
        ...record,
        isRxd: record.isRxd || false
      }));
    });

    const filteredRecords = computed(() => {
      if (!searchValue.value) return records.value;
      return records.value.filter(record => 
        record.realName.toLowerCase().includes(searchValue.value.toLowerCase())
      );
    });
    
    const headers = [
      { text: "이름", value: "realName", width: "80" },
      { text: "닉네임", value: "nickName", width: "80" },
      { text: "성별", value: "gender", width: "50" },
      { text: "난이도", value: "isRxd", width: "80" },
      { text: "기록", value: "score", width: "100" },
    ]

    return {
      headers,
      searchValue,
      filteredRecords
    }
  }
}
</script>

<style scoped>

.header-button {
  background-color: rgb(101, 107, 130);
  color: rgb(255, 255, 255)
}
</style>
