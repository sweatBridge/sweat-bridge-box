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
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-expiryDate="item">
          {{item.expiryDate}}&nbsp;
          <CButton
            color="dark"
            size="sm"
            @click="updateExpiryDate(item)"
          >
            갱신
          </CButton>
        </template>
        <template #item-duration="{ expiryDate }">
          {{ calculateRemainingDays(expiryDate) }}
        </template>
        <template #item-gender="{ gender }">
          {{gender}}
        </template>
        <template #item-age="{ birthDate }">
          {{ getAge(birthDate) }}
        </template>
        <template #item-operation="item">
          <CButton
            color="light"
            size="sm"
            @click="deleteItem(item)"
          >
            <CIcon name="cil-notes" />
          </CButton>
          <CButton
            color="danger"
            size="sm"
            @click="deleteItem(item)"
          >
            <CIcon name="cil-ban" />
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
</template>

<script>
import UpdateExpiryDateModal from "@/views/admin/common/modal/UpdateExpiryDateModal.vue"
import { ref, defineComponent, onMounted, computed } from "vue"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue"
import { useStore } from "vuex"
import {calculateAge} from "@/views/admin/util/member";

export default defineComponent({
  components: {
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
      { text: "만료 일자", value: "expiryDate", sortable: true, width: "250"},
      { text: "잔여 기간", value: "duration" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "기능", value: "operation", width: "100" }
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

    const calculateRemainingDays = (expiryDate) => {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const diff = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24))
      return diffDays
    }

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const updateMember = ref()

    return {
      headers,
      members,
      pendingMembers,
      searchValue,
      deleteItem,
      // approveMembers,
      checkApprovalRequestModalResult,
      calculateRemainingDays,
      getAge,
      // updateExpiryDate,
      updateMember,
    }
  },
  methods: {
    approveMembers() {
      this.$refs.approvalRequestModal.showModal()
    },
    updateExpiryDate(member) {
      console.log(member)
      this.$refs.updateExpiryDateModal.showModal()
      this.updateMember = member
    }
  }
})
</script>

<style scoped lang="scss"> </style>
