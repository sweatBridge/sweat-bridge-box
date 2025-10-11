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
            <CInputGroupText>회원권 플랜</CInputGroupText>
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
        :items="tableItems"
        item-key="__rowId"
        theme-color="#42A5F5"
        alternating
        :sort-by="'startDate'"
        :sort-desc="true"
        body-text-direction="center"
        header-text-direction="center"
      >
        <template #item-rowNo="slot">
          <div class="rowno">{{ slot.isRefundRow ? '' : (slot.__idx + 1) }}</div>
        </template>

        <template #item-startDate="slot">
          {{ getDateStr(slot.startDate) }}
        </template>

        <template #item-endDate="slot">
          {{ getDateStr(slot.endDate) }}
        </template>

        <template #item-type="slot">
          <span v-if="slot.isRefundRow">환불</span>
          <span v-else>{{ slot.type === 'countPass' ? '횟수권' : '기간권' }}</span>
        </template>

        <template #item-assignee="slot">
          <span v-if="slot.isRefundRow">{{ slot.assignee }}</span>
          <span v-else>{{ slot.assignee }}</span>
        </template>

        <template #item-price="slot">
          <span v-if="slot.isRefundRow">{{ slot.price }}</span>
          <span v-else>{{ slot.price }}</span>
        </template>

        <template #item-plan="slot">
          <span>{{ slot.plan }}</span>
        </template>

        <template #item-actions="slot">
          <div v-if="!slot.isRefundRow" class="actions-cell">
            <CDropdown variant="btn-group">
              <CDropdownToggle class="actions-toggle">선택</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem @click="openDelete(slot.__idx)">삭제</CDropdownItem>
                <CDropdownItem @click="openRefund(slot.__idx)">환불</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
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
  <MembershipExtraModal
    ref="extraModalRef"
    @deleted="afterDelete"
    @failed="afterDeleteFail"
    @refunded="afterRefund"
  />

</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import DatePicker from "vue3-datepicker";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
import { datetimeToSimpleStr } from "../../util/date";
import MembershipExtraModal from './MembershipExtraModal.vue'

export default {
  name: "MembershipModal",
  components: {DatePicker, ToastMessage, MembershipExtraModal},
  setup() {
    const store = useStore();
    const modalStatus = ref(false);
    const boxName = localStorage.getItem('boxName');

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
    const findRowIndex = (rowItem) => memberships.value.findIndex(m => m === rowItem)

    const tableHeaders = [
      { text: "#", value: "rowNo" }, 
      { text: "시작일", value: "startDate" },
      { text: "종료일", value: "endDate" },
      { text: "회원권 타입", value: "type" },
      { text: "가격", value: "price"},
      { text: "플랜", value: "plan" },
      { text: "담당자", value: "assignee" },
      { text: "작업", value: "actions" },
    ];

    const getDateStr = (date) => {
      return datetimeToSimpleStr(date);
    }

    const extraModalRef = ref(null)

    function openDelete(rowIdx) {
      extraModalRef.value?.open({ index: rowIdx, email: userEmail.value, mode: 'delete' })
    }

    function openRefund(rowIdx) {
      extraModalRef.value?.open({ index: rowIdx, email: userEmail.value, mode: 'refund' })
    }

    const tableItems = computed(() => {
      const out = []
      const list = Array.isArray(memberships.value) ? memberships.value : []
      for (let i = 0; i < list.length; i++) {
        const m = list[i]

        // normal row
        out.push({
          ...m,
          isRefundRow: false,
          __idx: i,
          __rowId: `m-${i}`, // unique key
        })

        // optional refund row (latest only)
        const refunds = Array.isArray(m.refund) ? m.refund : []
        if (refunds.length) {
          console.log("break1")
          const latest = refunds[refunds.length - 1]
          out.push({
            isRefundRow: true,
            __idx: i,
            __rowId: `m-${i}-refund`, // unique key different from parent
            startDate: m.startDate,
            endDate: m.endDate,
            assignee: latest?.assignee ?? '',
            price: latest?.amount ?? 0,
            refund: latest,
          })
        }
      }
      return out
    })


    async function refreshMemberships() {
      await store.dispatch('getUserMemberships', { email: userEmail.value })
      memberships.value = store.state.membership.userMemberships
    }

    async function afterDelete() {
      try {
        await refreshMemberships()
        toastMessageRef.value?.createToast({
          title: '성공',
          content: '회원권 삭제 성공',
          type: 'success',
        })
      } catch (error) {
        toastMessageRef.value?.createToast({
          title: '실패',
          content: '삭제 후 목록 갱신 실패: ' + (error?.message ?? String(error)),
          type: 'danger',
        })
      }
    }

    function afterDeleteFail(error) {
      toastMessageRef.value?.createToast({
        title: '실패',
        content: '회원권 삭제 실패: ' + (error?.message ?? String(error)),
        type: 'danger',
      })
    }

    async function afterRefund({ index, email, reason, amount, assignee }) {
      try {
        const orig = memberships.value[index]
        if (!orig) throw new Error('Membership not found at index')

        const now = new Date()

        // Build a NEW object to send (no local mutation)
        const updatedMembership = {
          ...orig,
          endDate: now,          // NOW at push time
          updatedAt: now,
          refund: [
            ...(Array.isArray(orig.refund) ? orig.refund : []),
            { reason, amount: Number(amount || 0), assignee}
          ],
        }

        await store.dispatch('updateMembershipInfo', {
          email: email || userEmail.value,
          box: boxName,
          idx: index,
          updatedMembership,
        })

        // Pull fresh data from backend (keeps UI canonical)
        await refreshMemberships()

        toastMessageRef.value?.createToast({
          title: '성공',
          content: `환불 처리 완료: 금액 ${Number(amount)}원, 담당자 ${assignee}`,
          type: 'success',
        })
      } catch (error) {
        toastMessageRef.value?.createToast({
          title: '실패',
          content: '환불 처리 실패: ' + (error?.message ?? String(error)),
          type: 'danger',
        })
      }
    }

    const handlePlanChange = () => {
      if (selectedPlanName.value === 'custom') {
        membershipType.value = '';
        count.value = "0";
        duration.value = 0;
        price.value = "0";
        return;
      }

      const selectedPlan = membershipPlans.value.find(plan => plan.plan === selectedPlanName.value);

      if (selectedPlan) {
        membershipType.value = selectedPlan.type;
        count.value = selectedPlan.count.toString();
        duration.value = selectedPlan.duration;
        price.value = selectedPlan.price.toString();
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
      if (!selectedPlanName.value || !membershipType.value || !price.value || !assignee.value || !startDate.value || !duration.value) {
        alert("입력하지 않은 정보가 있는지 확인해 주세요.")
        return
      }
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
            count: count.value !== undefined ? count.value.toString() : "0",
            price: price.value !== undefined ? price.value.toString() : "0",
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
            content: '회원권 추가 성공',
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
            content: error,
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
      toastMessageRef,
      extraModalRef,
      openDelete,
      afterDelete,
      afterDeleteFail,
      openRefund,
      afterRefund,
      findRowIndex,
      tableItems
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

.actions-cell { display: inline-flex; align-items: center; }

:deep(.actions-toggle) {
  font-size: inherit;       /* 테이블 셀 폰트 크기 상속 */
  line-height: inherit;     /* 행 라인하이트 상속(수직정렬 깔끔) */
  padding: 0.25rem 0.5rem;  /* 버튼 너무 크지 않게 */
  height: auto;             /* 셀 높이와 자연스럽게 맞춤 */
}
</style>
