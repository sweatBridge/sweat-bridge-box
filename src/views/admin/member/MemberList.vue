<template>
  <CCard>
    <CCardHeader class="card-header">
      <strong>회원 관리</strong>
      <div class="float-end">
        <CRow class="g-3">
          <CCol>
            <CButton
              @click="approveMembers"
              class="position-relative header-button" size="sm">
              <strong>회원 추가</strong>
            </CButton>
          </CCol>
          <CCol>
            <CButton
              @click="manageMembershipPlans"
              class="position-relative header-button" size="sm">
              <strong>멤버십</strong>
            </CButton>
          </CCol>
        </CRow>
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
        <template #item-type="{ remain }">
          {{ getType(remain) }}
        </template>
        <template #item-expired="{ remain }">
          {{ getExpiryDateStr(remain.expired) }}
        </template>
        <template #item-remainingVisits="{ remain }">
          {{ getRemainingVisits(remain) }}
        </template>
        <template #item-gender="{ gender }">
          {{ getGender(gender) }}
        </template>
        <template #item-operation="{ email, remain }">
          <CButton
            color="danger"
            size="sm"
            @click="deleteMember(email)"
          >
            삭제
          </CButton>
          <CButton
            :color=getRegisterButtonColor(remain.type)
            size="sm"
            @click="renewMembership(email)"
          >
            {{ getRegisterButtonDescription(remain.type) }}
          </CButton>
        </template>
        <template #item-membership="{email}">
          <CButton
            color="info"
            size="sm"
            @click="manageMembership(email)"
          >
            O
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
  <register-membership-modal ref="registerMembershipModal"/>
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
  findMemberById
} from "@/views/admin/util/member"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue"
import MemberDetailsModal from "@/views/admin/common/modal/member/MemberDetailsModal.vue";
import MemberDeletionModal from "@/views/admin/common/modal/MemberDeletionModal.vue";
import RegisterMembershipModal from "@/views/admin/common/modal/RegisterMembershipModal.vue";
import MembershipPlanModal from "@/views/admin/common/modal/membership/MembershipPlanModal.vue";
import MembershipModal from "@/views/admin/common/modal/membership/MembershipModal.vue";

export default defineComponent({
  components: {
    RegisterMembershipModal,
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
      { text: "등록 타입", value: "type"},
      { text: "만료 일자", value: "expired"},
      { text: "잔여 기간(일)", value: "remain.days", sortable: true},
      { text: "잔여 횟수(회)", value: "remainingVisits"},
      { text: "성별", value: "gender" },
      { text: "멤버십", value: "membership"},
      { text: "기능", value: "operation", width: "150" },
      { text: "상세", value: "details"},
    ]

    const members = computed(() => store.state.member.members)

    const searchValue = ref("")

    const getRegisterButtonDescription = (item) => {
      if (item === 'periodPass' || item === 'countPass') {
        return '갱신'
      } else {
        return '등록'
      }
    }
    // distinguish button color by type
    const getRegisterButtonColor = (type) => {
      if (type === 'periodPass' || type === 'countPass') {
        return 'secondary'
      } else {
        return 'dark'
      }
    }

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

    return {
      headers,
      members,
      searchValue,
      getRegisterButtonColor,
      getRegisterButtonDescription,
      getType,
      getExpiryDateStr,
      getRemainingVisits,
      getAge,
      getGender,
      memberDetatilIdx,
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
      let member = findMemberById(this.members, id)
      console.log(id)
      console.log(member)
      this.$refs.membershipModal.showModal()
    },
    renewMembership(id) {
      let member = findMemberById(this.members, id)
      this.$refs.registerMembershipModal.showModal(member)
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
