<template>
  <CCard>
    <CCardHeader class="card-header">
      <strong>회원 관리</strong>
      <div class="float-end">
        <CButton
          @click="approveMembers"
          class="position-relative header-button" size="sm">
          <strong>승인 요청</strong>
          <CBadge color="danger" position="top-end" shape="rounded-pill">
            {{pendingMembers.length}} <span class="visually-hidden">unread messages</span>
          </CBadge>
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
        <template #item-operation="{ index, remain }">
          <CButton
            color="danger"
            size="sm"
            @click="deleteMember(index)"
          >
            삭제
          </CButton>
          <CButton
            :color=getRegisterButtonColor(remain.type)
            size="sm"
            @click="renewMembership(index)"
          >
            {{ getRegisterButtonDescription(remain.type) }}
          </CButton>
        </template>
        <template #item-details="{ index }">
          <CButton
            color="light"
            size="sm"
            @click="showMemberDetails(index)"
          >
            <CIcon name="cil-notes" />
          </CButton>
        </template>
      </EasyDataTable>
    </CCardBody>
  </CCard>
  <approval-request-modal ref="approvalRequestModal"/>
  <register-membership-modal ref="registerMembershipModal"/>
  <member-details-modal :index="memberDetatilIdx" ref="memberDetailsModal" />
  <member-deletion-modal ref="deleteModal" />
</template>

<script>
import {ref, defineComponent, onMounted, computed} from "vue"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue"
import { useStore } from "vuex"
import {
  calculateAge,
  convertRemainingVisits,
  convertTimestampToString,
  convertGenderToKorean,
  getTypeKor
} from "@/views/admin/util/member"
import MemberDetailsModal from "@/views/admin/common/modal/MemberDetailsModal.vue"
import MemberDeletionModal from "@/views/admin/common/modal/MemberDeletionModal.vue";
import RegisterMembershipModal from "@/views/admin/common/modal/RegisterMembershipModal.vue";

export default defineComponent({
  components: {
    RegisterMembershipModal,
    MemberDeletionModal,
    MemberDetailsModal,
    ApprovalRequestModal,
  },
  setup() {
    const store = useStore()
    onMounted(() => {
      const boxName = ref(localStorage.getItem('boxName') || '');
      store.dispatch('getMembers', { box: boxName.value })
      store.dispatch('getPendingMembers', { box: boxName.value })
    })
    const headers = [
      { text: "이름", value: "realName" },
      { text: "닉네임", value: "nickName" },
      { text: "등록 타입", value: "type"},
      { text: "만료 일자", value: "expired"},
      { text: "잔여 기간(일)", value: "remain.days", sortable: true},
      { text: "잔여 횟수(회)", value: "remainingVisits"},
      { text: "성별", value: "gender" },
      { text: "기능", value: "operation", width: "150" },
      { text: "상세", value: "details"},
    ]

    const members = computed(() => store.state.member.members)
    const pendingMembers = computed(() => store.state.member.pendingMembers)

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
      pendingMembers,
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
    deleteMember(index) {
      const member = this.members[index - 1]
      this.$refs.deleteModal.showModal(member)
    },
    renewMembership(index) {
      const member = this.members[index - 1]
      this.$refs.registerMembershipModal.showModal(member)
    },
    showMemberDetails(idx) {
      this.$refs.memberDetailsModal.showModal()
      this.memberDetatilIdx = idx
    }
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
