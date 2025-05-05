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
    show-index
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
    <template #item-score="{ score, index }">
      <div style="display: flex; align-items: center;">
        <input
          v-if="editingRows[index - 1]"
          v-model="editingScores[index - 1]"
          type="text"
          style="width: 80px;"
        />
        <span v-else>{{ score }}</span>
      </div>
    </template>
    <template #item-actions="{ index }">
      <div style="display: flex; gap: 8px;">
        <CButton
          v-if="editingRows[index - 1]"
          color="success"
          size="sm"
          @click="saveScore(index - 1)"
        >
          저장
        </CButton>
        <CButton
          v-else
          color="primary"
          size="sm"
          @click="startEditing(index - 1)"
        >
          수정
        </CButton>
      </div>
    </template>
  </EasyDataTable>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import {ref, computed} from "vue";
import {useStore} from "vuex";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";

export default {
  name: "MemberRecord",
  components: {
    ToastMessage
  },
  setup() {
    const store = useStore();
    const searchValue = ref('');
    const editingRows = ref({});  // 각 row별 수정 상태
    const editingScores = ref({});  // 각 row별 수정중인 점수
    const toastMessageRef = ref(null);
    
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

    const startEditing = (index) => {
      editingRows.value = { ...editingRows.value, [index]: true };
      editingScores.value = { 
        ...editingScores.value, 
        [index]: filteredRecords.value[index].score 
      };
    };

    const saveScore = async (index) => {
      try {
        const record = filteredRecords.value[index];
        console.log(record)
        await store.dispatch('updateWorkoutRecord', {
          recordId: record.id,
          score: editingScores.value[index]
        });

        toastMessageRef.value?.createToast({
          title: '성공',
          content: '기록이 수정되었습니다.',
          type: 'success'
        });

        // 수정 상태 초기화
        editingRows.value[index] = false;
        delete editingScores.value[index];
      } catch (error) {
        console.error('Error in saveScore:', error);
        toastMessageRef.value?.createToast({
          title: '실패',
          content: '기록 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류가 발생했습니다'),
          type: 'danger'
        });
      }
    };
    
    const headers = [
      { text: "이름", value: "realName", width: "80" },
      { text: "닉네임", value: "nickName", width: "80" },
      { text: "성별", value: "gender", width: "50" },
      { text: "난이도", value: "isRxd", width: "80" },
      { text: "기록", value: "score", width: "100" },
      { text: "수정", value: "actions", width: "80" }
    ]

    return {
      headers,
      searchValue,
      filteredRecords,
      editingRows,
      editingScores,
      startEditing,
      saveScore,
      toastMessageRef
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
