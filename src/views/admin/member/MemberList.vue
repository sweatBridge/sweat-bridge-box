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
        <template #item-duration="{ duration }">
          {{duration}}
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
      { text: "잔여 기간", value: "duration", sortable: true },
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

    const items = [
      {
        name: '김대현',
        duration: 30,
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
        gender: '여',
        age: 27,
        weight: 40,
        height: 160,
        phone: "010-1234-5678",
        purpose: '건강',
      },
      {
        name: '김재인',
        duration: 10,
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
      checkApprovalRequestModalResult
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
