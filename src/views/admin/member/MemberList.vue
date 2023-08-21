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
            3 <span class="visually-hidden">unread messages</span>
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
        :items="items"
        search-field="name"
        :search-value="searchValue"
      >
        <template #item-name="{ name }">
          {{name}}
        </template>
        <template #item-expiryDate="{ expiryDate }">
          {{expiryDate}}&nbsp;
          <CButton
            color="dark"
            size="sm"
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
        <template #item-age="{ age }">
          {{age}}
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
</template>

<script>
import { ref, defineComponent } from "vue"
import ApprovalRequestModal from "@/views/admin/common/modal/ApprovalRequestModal.vue";

export default defineComponent({
  components: {ApprovalRequestModal},
  setup() {
    const headers = [
      { text: "이름", value: "name" },
      { text: "만료 일자", value: "expiryDate", sortable: true, width: "250"},
      { text: "잔여 기간", value: "duration" },
      { text: "성별", value: "gender" },
      { text: "나이", value: "age" },
      { text: "기능", value: "operation", width: "100" }
    ]

    const searchValue = ref("");

    const deleteItem = (val) => {
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

    const picked = ref(new Date())

    const items = [
      {
        name: '김대현',
        expiryDate: '2023-11-07',
        gender: '남',
        age: 28,
        weight: 80,
        height: 180,
        phone: "010-1234-5678",
        purpose: '다이어트',
      },
      {
        name: '박솔희',
        duration: 60,
        expiryDate: '2023-12-07',
        gender: '여',
        age: 27,
        weight: 40,
        height: 160,
        phone: "010-1234-5678",
        purpose: '건강',
      },
      {
        name: '김재인',
        expiryDate: '2024-03-07',
        gender: '남',
        age: 27,
        weight: 70,
        height: 180,
        phone: "010-1234-5678",
        purpose: '재미',
      },
    ];

    return {
      headers,
      items,
      searchValue,
      deleteItem,
      // approveMembers,
      checkApprovalRequestModalResult,
      calculateRemainingDays,
      picked
    }
  },
  methods: {
    approveMembers() {
      this.$refs.approvalRequestModal.showModal()
    },
  }
})
</script>

<style scoped lang="scss"> </style>
