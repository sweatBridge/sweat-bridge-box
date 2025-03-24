<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    size="xl"
  >
    <CModalHeader>
      <CModalTitle>회원권 관리</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="membership-container">
        <CRow>
          <!-- ✅ 플랜 선택 드롭다운 -->
          <CInputGroup class="mb-3">
            <CInputGroupText>멤버십 플랜</CInputGroupText>
            <CFormSelect v-model="selectedPlanName" @update:modelValue="handlePlanChange">
              <option value="">플랜 선택</option>
              <option v-for="plan in membershipPlans" :key="plan.plan" :value="plan.plan">
                {{ plan.plan }}
              </option>
              <option value="custom">커스텀 플랜</option>
            </CFormSelect>
            <CInputGroupText>담당자</CInputGroupText>
            <CFormInput v-model="assignee"/>
          </CInputGroup>
        </CRow>

        <CRow>
          <CInputGroup class="mb-3">
            <CInputGroupText>회원권 타입</CInputGroupText>
            <CFormSelect v-model="membershipType" @change="handleTypeChange">
              <option value="">등록 타입 선택</option>
              <option value="periodPass">기간권</option>
              <option value="countPass">횟수권</option>
            </CFormSelect>
          </CInputGroup>
        </CRow>

        <CRow v-if="membershipType === 'periodPass'">
          <CInputGroup class="mb-3">
            <CInputGroupText>기간(월)</CInputGroupText>
            <CFormInput v-model="duration" />
          </CInputGroup>
        </CRow>

        <CRow v-if="membershipType === 'countPass'">
          <CInputGroup class="mb-3">
            <CInputGroupText>기간(월)</CInputGroupText>
            <CFormInput v-model="duration" />
            <CInputGroupText>횟수</CInputGroupText>
            <CFormInput v-model="count" />
          </CInputGroup>
        </CRow>

        <CRow>
          <CInputGroup class="mb-3">
            <CInputGroupText>가격</CInputGroupText>
            <CFormInput v-model="price" />
          </CInputGroup>
        </CRow>

        <CRow class="justify-content-end">
          <CCol md="auto">
            <CButton color="success" @click="addMembershipPlan" size="sm">
              추가
            </CButton>
          </CCol>
        </CRow>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="() => {modalStatus = false}">
        취소
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";

export default {
  name: "MembershipModal",
  setup() {
    const store = useStore();
    const modalStatus = ref(false);

    const membershipPlans = computed(() => store.getters.getMembershipPlans);
    const assignee = ref("");

    const selectedPlanName = ref("");

    const membershipType = ref("");
    const count = ref(0);
    const duration = ref(0);
    const price = ref(0);

    const handlePlanChange = () => {
      if (selectedPlanName.value === 'custom') {
        membershipType.value = '';
        count.value = 0;
        duration.value = 0;
        price.value = 0;
        return;
      }

      const selectedPlan = membershipPlans.value.find(plan => plan.plan === selectedPlanName.value);

      if (selectedPlan) {
        membershipType.value = selectedPlan.type;
        count.value = selectedPlan.count;
        duration.value = selectedPlan.duration;
        price.value = selectedPlan.price;
      }
    };

    const handleTypeChange = () => {
      duration.value = 0;
      count.value = 0;
    };

    const showModal = async () => {
      await store.dispatch("getMembershipPlans");
      modalStatus.value = true;
    };

    return {
      modalStatus,
      showModal,
      membershipPlans,
      assignee,
      selectedPlanName,
      membershipType,
      count,
      duration,
      price,
      handlePlanChange,
      handleTypeChange
    };
  }
};
</script>


<style scoped>
.membership-container {
  border: 2px solid black; /* ✅ 검정색 테두리 */
  border-radius: 8px; /* ✅ 모서리를 둥글게 */
  padding: 16px; /* ✅ 내부 여백 */
  margin-bottom: 16px; /* ✅ 아래 요소와 간격 추가 */
}

</style>
