<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    size="xl"
  >
    <CModalHeader>
      <CModalTitle>멤버십(회원권) 플랜</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="membership-container">
        <CRow>
          <CInputGroup class="mb-3">
            <CInputGroupText>플랜 이름</CInputGroupText>
            <CFormInput v-model="plan" placeholder="[예시] (재등록) 6개월 기간권"/>
          </CInputGroup>
          <CInputGroup class="mb-3">
            <CInputGroupText>회원권 타입</CInputGroupText>
            <CFormSelect v-model="membershipType" @change="handleTypeChange">
              <option>등록 타입 선택</option>
              <option value="periodPass">기간권</option>
              <option value="countPass">횟수권</option>
            </CFormSelect>
          </CInputGroup>
        </CRow>
        
        <CRow v-if="membershipType === 'periodPass'">
          <CInputGroup class="mb-3">
            <CInputGroupText>기간(일)</CInputGroupText>
            <CFormInput v-model="duration" />
          </CInputGroup>
        </CRow>

        <CRow v-if="membershipType === 'countPass'">
          <CInputGroup class="mb-3">
            <CInputGroupText>기간(일)</CInputGroupText>
            <CFormInput v-model="duration" />
            <CInputGroupText>횟수</CInputGroupText>
            <CFormInput v-model="count" />
          </CInputGroup>
        </CRow>

        <CRow>
          <CInputGroup class="mb-3">
            <CInputGroupText>가격</CInputGroupText>
            <CFormInput v-model="price"/>
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
      <EasyDataTable
        :headers="tableHeaders"
        :items="membershipPlans"
        theme-color="#42A5F5"
        alternating
      >
      <template #item-type="{ value }">
        {{ value === "countPass" ? "횟수권" : "기간권" }}
      </template>
      <template #item-actions="{ plan }">
        <CButton color="danger" @click="deleteMembershipPlan(plan)">
          X
        </CButton>
      </template>
      </EasyDataTable>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="() => {modalStatus = false}">
        취소
      </CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import { ref } from "vue"
import { useStore } from "vuex";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default {
  name: "RegisterMembershipPlanModal",
  components: {
    ToastMessage
  },
  setup(props, { emit }) {
    const store = useStore()
    const modalStatus = ref(false)
    const plan = ref("")
    const membershipType = ref("")
    const count = ref(0)
    const duration = ref(0)
    const price = ref(0)
    const membershipPlans = ref([]);

    const tableHeaders = [
      { text: "플랜 이름", value: "plan" },
      { text: "회원권 타입", value: "type" },
      { text: "횟수", value: "count" },
      { text: "기간(일)", value: "duration" },
      { text: "가격", value: "price"},
      { text: "삭제", value: "actions" },
    ];

    const showModal = async () => {
      await store.dispatch("getMembershipPlans")
      membershipPlans.value = store.state.membership.plans;
      modalStatus.value = true
    }

    const handleTypeChange = () => {
      duration.value = 0
      count.value = 0
    }

    const addMembershipPlan = () => {
      if (!plan.value || !membershipType.value) {
        alert("플랜 이름과 회원권 타입을 입력하세요.")
        return
      }

      const newPlan = {
        plan: plan.value,
        type: membershipType.value,
        count: membershipType.value === "countPass" ? count.value : 0,
        duration: duration.value,
        price: price.value,
      }

      store.dispatch("addMembershipPlan", { plan: newPlan })

      plan.value = ""
      membershipType.value = ""
      count.value = 0
      duration.value = 0
      price.value = 0
    }

    const deleteMembershipPlan = (plan) => {
      if (confirm(`"${plan}" 플랜을 삭제하시겠습니까?`)) {
        store.dispatch("deleteMembershipPlan", plan);
      }
      store.dispatch("deleteMembershipPlan", plan);
    };

    const register = () => {
      modalStatus.value = false
    }

    return {
      modalStatus,
      plan,
      membershipType,
      count,
      duration,
      price,
      membershipPlans,
      tableHeaders,
      showModal,
      handleTypeChange,
      addMembershipPlan,
      deleteMembershipPlan,
      register
    }
  }
}
</script>

<style scoped>
.membership-container {
  border: 2px solid black; /* ✅ 검정색 테두리 */
  border-radius: 8px; /* ✅ 모서리를 둥글게 */
  padding: 16px; /* ✅ 내부 여백 */
  margin-bottom: 16px; /* ✅ 아래 요소와 간격 추가 */
}

</style>
