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
        search-field="name"
        :search-value="searchValue"
        show-index
        body-text-direction="center"
        header-text-direction="center"
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-type="{ type }">
          {{ getType(type) }}
        </template>
        <template #item-expiryDate="{ expiryDate }">
          {{ getExpiryDateStr(expiryDate) }}
        </template>
        <template #item-duration="{ expiryDate }">
          {{ getRemainingDays(expiryDate) }}
        </template>
        <template #item-remainingVisits="{ index }">
          {{ getRemainingVisits(index) }}
        </template>
        <template #item-gender="{ gender }">
          {{gender}}
        </template>
        <template #item-age="{ birthDate }">
          {{ getAge(birthDate) }}
        </template>
        <template #item-operation="{ index, type }">
          <CButton
            color="danger"
            size="sm"
            @click="deleteMember(index)"
          >
            삭제
          </CButton>
          <CButton
            color="dark"
            size="sm"
            @click="renewMembership(index)"
          >
            {{ getRegisterButtonDescription(type) }}
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
import {ref, defineComponent, onMounted, computed, reactive} from "vue"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue"
import { useStore } from "vuex"
import {
  calculateAge,
  calculateRemainingDays,
  convertRemainingVisits,
  convertTimestampToString, convertTypeToKorean,
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
      store.dispatch('getMembers', { box: 'CFBD' })
      store.dispatch('getPendingMembers', { box: 'CFBD' })
    })
    const headers = [
      { text: "이름", value: "name" },
      { text: "등록 타입", value: "type", sortable: true},
      { text: "만료 일자", value: "expiryDate", sortable: true},
      { text: "잔여 기간(일)", value: "duration" },
      { text: "잔여 횟수(회)", value: "remainingVisits"},
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "기능", value: "operation", width: "150" },
      { text: "상세", value: "details"},
    ]

    const members = computed(() => store.state.member.members)
    const pendingMembers = computed(() => store.state.member.pendingMembers)

    const searchValue = ref("")

    const getRegisterButtonDescription = (type) => {
      if (type === 'PeriodPass' || type === 'CountPass') {
        return '갱신'
      } else {
        return '등록'
      }
    }

    const getType = (type) => {
      return convertTypeToKorean(type)
    }

    const getExpiryDateStr = (timestamp) => {
      return convertTimestampToString(timestamp)
    }

    const getRemainingDays = (expiryDate) => {
      const expiryDateStr = convertTimestampToString(expiryDate)
      return calculateRemainingDays(expiryDateStr)
    }

    const getRemainingVisits = (index) => {
      const member = members.value[index - 1]
      return convertRemainingVisits(member.type, member.remainingVisits)
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
      getRegisterButtonDescription,
      getType,
      getExpiryDateStr,
      getRemainingDays,
      getRemainingVisits,
      getAge,
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
</style>
