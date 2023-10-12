<template>
  <CCard>
    <CCardHeader component="h5">
      <CIcon icon="cil-user" size="lg" /> 회원 관리
      <div class="float-end">
        <CButton
          @click="approveMembers"
          color="primary" class="position-relative" size="sm">
          승인 요청
          <CBadge color="danger" position="top-end" shape="rounded-pill">
            {{pendingMembers.length}} <span class="visually-hidden">unread messages</span>
          </CBadge>
        </CButton>
      </div>
    </CCardHeader>
    <CCardBody>
      <span>이름 검색: </span>
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
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-type="{ type }">
          {{type}}
        </template>
        <template #item-expiryDate="{ expiryDate }">
          {{expiryDate}}
        </template>
        <template #item-duration="{ expiryDate }">
          {{ getRemainingDays(expiryDate) }}
        </template>
        <template #item-gender="{ gender }">
          {{gender}}
        </template>
        <template #item-age="{ birthDate }">
          {{ getAge(birthDate) }}
        </template>
        <template #item-operation="{ index }">
          <CButton
            color="dark"
            size="sm"
            @click="renewMembership()"
          >
            갱신
          </CButton>
          <CButton
            color="danger"
            size="sm"
            @click="deleteItem(index)"
          >
            삭제
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
  <approval-request-modal
    ref="approvalRequestModal"
  />
  <update-expiry-date-modal
    :member="updateMember"
    ref="updateExpiryDateModal"
  />
  <member-details-modal :index="memberDetatilIdx" ref="memberDetailsModal" />
</template>

<script>
import UpdateExpiryDateModal from "@/views/admin/common/modal/UpdateExpiryDateModal.vue"
import {ref, defineComponent, onMounted, computed, reactive} from "vue"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue"
import { useStore } from "vuex"
import {calculateAge, calculateRemainingDays} from "@/views/admin/util/member"
import MemberDetailsModal from "@/views/admin/common/modal/MemberDetailsModal.vue"

export default defineComponent({
  components: {
    MemberDetailsModal,
    UpdateExpiryDateModal,
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
      { text: "등록 타입", value: "type"},
      { text: "만료 일자", value: "expiryDate", sortable: true, width: "250"},
      { text: "잔여 기간", value: "duration" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "기능", value: "operation", width: "150" },
      { text: "상세", value: "details"},
    ]

    const members = computed(() => store.state.member.members)
    const pendingMembers = computed(() => store.state.member.pendingMembers)

    const searchValue = ref("")

    const deleteItem = (val) => {
      console.log(store.state.member.members)
      console.log(store.state.member.pendingMembers)
      console.log(val)
    }

    const checkApprovalRequestModalResult = (result) => {
      console.log(result)
    }

    const getRemainingDays = (expiryDate) => {
      return calculateRemainingDays(expiryDate)
    }

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const updateMember = reactive({})
    const memberDetatilIdx = ref(0)

    return {
      headers,
      members,
      pendingMembers,
      searchValue,
      deleteItem,
      checkApprovalRequestModalResult,
      getRemainingDays,
      getAge,
      updateMember,
      memberDetatilIdx,
    }
  },
  methods: {
    approveMembers() {
      this.$refs.approvalRequestModal.showModal()
    },
    renewMembership() {
      this.$refs.updateExpiryDateModal.showModal()
    },
    updateExpiryDate(member) {
      this.$refs.updateExpiryDateModal.showModal()
      this.updateMember = member
    },
    showMemberDetails(idx) {
      this.$refs.memberDetailsModal.showModal()
      this.memberDetatilIdx = idx
    }
  }
})
</script>

<style scoped lang="scss"> </style>
