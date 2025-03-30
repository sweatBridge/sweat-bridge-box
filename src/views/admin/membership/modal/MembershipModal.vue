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

        <CRow>
          <CInputGroup class="mb-3">
            <CInputGroupText id="basic-addon3">일자</CInputGroupText>
            <CButton style="display: flex; align-items: center;">
              <CIcon name="cil-calendar" style="margin-right: 8px;"/>
              <DatePicker v-model="startDate"/>
            </CButton>
          </CInputGroup>
        </CRow>

        <CRow class="justify-content-end">
          <CCol md="auto">
            <CButton color="success" @click="addMembership" size="sm">
              추가
            </CButton>
          </CCol>
        </CRow>
      </div>
      <EasyDataTable
        :headers="tableHeaders" 
        :items="memberships"
        theme-color="#42A5F5"
        alternating
      >
      <template #item-startDate="{ startDate }">
        {{ getDateStr(startDate) }}
      </template>
      <template #item-endDate="{ endDate }">
        {{ getDateStr(endDate) }}
      </template>
      <template #item-type="{ type }">
        {{ type === "countPass" ? "횟수권" : "기간권" }}
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
import { ref, computed } from "vue";
import { useStore } from "vuex";
import DatePicker from "vue3-datepicker";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import { datetimeToSimpleStr } from "../../util/date";

export default {
  name: "MembershipModal",
  components: {DatePicker, ToastMessage},
  setup() {
    const store = useStore();
    const modalStatus = ref(false);

    const userEmail = ref("");

    const membershipPlans = computed(() => store.getters.getMembershipPlans);
    const assignee = ref("");

    const selectedPlanName = ref("");

    const membershipType = ref("");
    const count = ref(0);
    const duration = ref(0);
    const price = ref(0);
    const startDate = ref(null);

    const memberships = ref([]);

    const toastMessageRef = ref(null)

    const tableHeaders = [
      { text: "시작일", value: "startDate" },
      { text: "종료일", value: "endDate" },
      { text: "회원권 타입", value: "type" },
      { text: "가격", value: "price"},
      { text: "플랜 이름", value: "plan" },
      { text: "삭제", value: "actions" },
    ];

    const getDateStr = (date) => {
      return datetimeToSimpleStr(date);
    }

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

    const showModal = async (userId) => {
      await store.dispatch("getMembershipPlans");
      await store.dispatch("getUserMemberships", {'email': userId});
      userEmail.value = userId;
      memberships.value = store.state.membership.userMemberships;
      modalStatus.value = true;
    };

    const addMembership = async () => {
      const start = new Date(startDate.value);
      const end = new Date(start.getTime());

      const durationInt = parseInt(duration.value, 10);  // 정수 변환

      const totalMonths = start.getMonth() + durationInt;
      end.setFullYear(start.getFullYear() + Math.floor(totalMonths / 12));
      end.setMonth(totalMonths % 12);

      const now = new Date();
      try {
        const payload = {
          'email': userEmail.value,
          'membership': {
            plan: selectedPlanName.value,
            type: membershipType.value,
            count: count.value,
            price: price.value,
            assignee: assignee.value,
            startDate: start,
            endDate: end,
            holdStartDate: null,
            holdEndDate: null,
            createdAt: now,
            updatedAt: now,
          }
        }

        await store.dispatch("addUserMembership", payload)

        toastMessageRef.value.createToast(
          {
            title: '성공',
            content: '멤버십 추가 성공',
            type: 'success'
          }
        )
        setTimeout(() => {
          location.reload()
        }, 500)
      } catch (error) {
        toastMessageRef.value.createToast(
          {
            title: '실패',
            content: '멤버십 추가 실패' + error,
            type: 'danger'
          }
        )
      }
    }

    return {
      modalStatus,
      showModal,
      userEmail,
      membershipPlans,
      assignee,
      selectedPlanName,
      membershipType,
      count,
      duration,
      price,
      startDate,
      handlePlanChange,
      handleTypeChange,
      addMembership,
      memberships,
      tableHeaders,
      getDateStr,
      toastMessageRef,
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
