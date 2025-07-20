<template>
  <CCard>
    <CCardHeader class="card-header">
      <strong>회원 관리</strong>
      <div class="float-end">
        <CButton
          @click="approveMembers"
          class="position-relative header-button" size="sm">
          <strong>회원추가</strong>
        </CButton>
        <CButton
          @click="manageMembershipPlans"
          class="position-relative header-button" size="sm">
          <strong>멤버십</strong>
        </CButton>
      </div>
    </CCardHeader>
    <CCardBody>
      <CBadge class="p-lg-2 name-button">
        <strong>이름</strong>
      </CBadge>
      :
      <input type="text" v-model="searchValue">
      <br>
      <br>
      <EasyDataTable
        buttons-pagination
        :headers="headers"
        :items="members"
        search-field="realName"
        :search-value="searchValue"
        show-index
        body-text-direction="center"
        header-text-direction="center"
      >
        <template #item-realName="{ realName }">
          {{realName}}
        </template>
        <template #item-nickName="{ nickName }">
          {{nickName}}
        </template>
        <template #item-type="{ item }">
          {{item.membershipInfo.type}}
        </template>
        <template #item-expiryDate="{ item }">
          {{item.membershipInfo.expiryDate}}
        </template>
        <template #item-remainingDays="{ item }">
          {{item.membershipInfo.remainingDays}}
        </template>
        <template #item-remainingVisits="{ item }">
          {{item.membershipInfo.remainingVisits}}
        </template>
        <template #item-gender="{ gender }">
          {{ getGender(gender) }}
        </template>
        <template #item-operation="{ email }">
          <CButton
            color="info"
            size="sm"
            @click="manageMembership(email)"
          >
            멤버십
          </CButton>
          <CButton
            color="danger"
            size="sm"
            @click="deleteMember(email)"
          >
            삭제
          </CButton>
        </template>
        <template #item-details="{ email }">
          <CButton
            color="light"
            size="sm"
            @click="showMemberDetails(email)"
          >
            <CIcon name="cil-notes" />
          </CButton>
        </template>
      </EasyDataTable>
    </CCardBody>
  </CCard>
  <approval-request-modal ref="approvalRequestModal"/>
  <member-details-modal ref="memberDetailsModal" />
  <member-deletion-modal ref="deleteModal" />
  <membership-plan-modal ref="membershipPlanModal" />
  <membership-modal ref="membershipModal" />
</template>

<script>
import {ref, defineComponent, onMounted, computed} from "vue"
import { useStore } from "vuex"
import {
  calculateAge,
  convertRemainingVisits,
  convertTimestampToString,
  convertGenderToKorean,
  getTypeKor,
  findMemberById,
  getMembershipInfo
} from "@/views/admin/util/member"
import ApprovalRequestModal from "@/views/admin/member/modal/ApprovalRequestModal.vue";
import MemberDetailsModal from "@/views/admin/member/modal/MemberDetailsModal.vue";
import MemberDeletionModal from "@/views/admin/member/modal/MemberDeletionModal.vue";
import MembershipPlanModal from "@/views/admin/membership/modal/MembershipPlanModal.vue";
import MembershipModal from "@/views/admin/membership/modal/MembershipModal.vue";

export default defineComponent({
  components: {
    MemberDeletionModal,
    MemberDetailsModal,
    ApprovalRequestModal,
    MembershipPlanModal,
    MembershipModal,
  },
  setup() {
    const store = useStore()
    onMounted(() => {
      const boxName = ref(localStorage.getItem('boxName') || '');
      store.dispatch('getMembers', { box: boxName.value })
    })
    const headers = [
      { text: "이름", value: "realName" },
      { text: "닉네임", value: "nickName" },
      { text: "등록 타입", value: "membershipInfo.type"},
      { text: "만료 일자", value: "membershipInfo.expiryDate"},
      { text: "잔여 기간", value: "membershipInfo.remainingDays"},
      { text: "잔여 횟수", value: "membershipInfo.remainingVisits"},
      { text: "성별", value: "gender" },
      { text: "기능", value: "operation", width: "150" },
      { text: "상세", value: "details"},
    ]

    const members = computed(() => {
      return store.state.member.members.map(member => ({
        ...member,
        membershipInfo: getMembershipInfo(member.memberships, member.futureMemberships)
      }))
    })

    const searchValue = ref("")

    const getType = (item) => {
      return getTypeKor(item.type, item.days)
    }

    const getExpiryDateStr = (item) => {
      return convertTimestampToString(item)
    }

    const getRemainingVisits = (item) => {
      return convertRemainingVisits(item.type, item.count)
    }

    const getGender = (item) => {
      return convertGenderToKorean(item)
    }

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const memberDetatilIdx = ref(0)
    const membershipModal = ref(null)

    return {
      headers,
      members,
      searchValue,
      getType,
      getExpiryDateStr,
      getRemainingVisits,
      getAge,
      getGender,
      memberDetatilIdx,
      membershipModal
    }
  },
  methods: {
    approveMembers() {
      this.$refs.approvalRequestModal.showModal()
    },
    deleteMember(id) {
      let member = findMemberById(this.members, id)
      this.$refs.deleteModal.showModal(member)
    },
    manageMembership(id) {
      this.$refs.membershipModal.showModal(id)
    },
    showMemberDetails(id) {
      let member = findMemberById(this.members, id)
      this.$refs.memberDetailsModal.showModal(member)
    },
    manageMembershipPlans() {
      this.$refs.membershipPlanModal.showModal()
    },
  }
})
</script>

<style scoped lang="scss">
.header-button {
  background-color: #ffffff;
  color: rgb(70, 100, 200)
}
.card-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}
.name-button {
  background-color: rgb(101, 107, 130);
  color: rgb(255, 255, 255)
}
.fail-row {
  --easy-table-body-row-background-color: #f56c6c;
  --easy-table-body-row-font-color: #fff;
}
.pass-row {
  --easy-table-body-row-background-color: #67c23a;
  --easy-table-body-row-font-color: #fff;
}
</style>
