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

      <!-- 현재 유효한 회원권 표시 -->
      <CCard class="mb-4">
        <CCardHeader>
          <strong>현재 유효한 회원권</strong>
        </CCardHeader>
        <CCardBody>
          <div v-if="userCurrentMemberships.length === 0" class="text-center text-muted no-membership-message">
            현재 유효한 회원권이 없습니다.
          </div>
          <div v-else-if="userCurrentMemberships.length > 1" class="text-center text-muted">
            현재 유효한 회원권이 {{ userCurrentMemberships.length }}개 있습니다.
          </div>
          <div v-else>
            <CRow class="mb-2">
              <CCol sm="3"><strong>시작일:</strong></CCol>
              <CCol>{{ getDateStr(userCurrentMemberships[0].startDate) }}</CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="3"><strong>종료일:</strong></CCol>
              <CCol>{{ getDateStr(userCurrentMemberships[0].endDate) }}</CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="3"><strong>회원권 타입:</strong></CCol>
              <CCol>{{ userCurrentMemberships[0].type === "countPass" ? "횟수권" : "기간권" }}</CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="3"><strong>가격:</strong></CCol>
              <CCol>{{ userCurrentMemberships[0].price }}원</CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="3"><strong>플랜:</strong></CCol>
              <CCol>{{ userCurrentMemberships[0].plan }}</CCol>
            </CRow>
            <CRow class="mb-2">
              <CCol sm="3"><strong>담당자:</strong></CCol>
              <CCol>{{ userCurrentMemberships[0].assignee }}</CCol>
            </CRow>
          </div>
        </CCardBody>
      </CCard>

      <EasyDataTable
        :headers="tableHeaders" 
        :items="memberships"
        theme-color="#42A5F5"
        show-index
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
      <template #item-actions="{ index }">
        <CButton color="danger" @click="deleteMembership(index - 1)">
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
    const userCurrentMemberships = computed(() => store.state.membership.userCurrentMemberships);

    const toastMessageRef = ref(null)

    const tableHeaders = [
      { text: "시작일", value: "startDate" },
      { text: "종료일", value: "endDate" },
      { text: "회원권 타입", value: "type" },
      { text: "가격", value: "price"},
      { text: "플랜", value: "plan" },
      { text: "담당자", value: "assignee" },
      { text: "삭제", value: "actions" },
    ];

    const getDateStr = (date) => {
      return datetimeToSimpleStr(date);
    }

    const deleteMembership = async (index) => {
      try {
        const payload = {
          'index': index,
          'email': userEmail.value
        }

        await store.dispatch("removeUserMembership", payload)

        toastMessageRef.value.createToast(
          {
            title: '성공',
            content: '멤버십 삭제 성공',
            type: 'success'
          }
        )
        
        // 삭제 후 회원권 목록을 다시 불러옵니다
        await store.dispatch("getUserMemberships", {'email': userEmail.value});
        memberships.value = store.state.membership.userMemberships;
      } catch (error) {
        console.error('Error in deleteMembership:', error);
        toastMessageRef.value.createToast(
          {
            title: '실패',
            content: '멤버십 삭제 실패: ' + error.message,
            type: 'danger'
          }
        )
      }
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
      userCurrentMemberships,
      tableHeaders,
      getDateStr,
      deleteMembership,
      toastMessageRef,
    };
  }
};
</script>


<style scoped>
.membership-container {
  border: 2px solid black;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.current-membership-container {
  border: 2px solid black;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.no-membership-message {
  padding: 80px 0;  /* 위아래로 4줄의 여백을 주기 위해 80px 설정 */
}
</style>
