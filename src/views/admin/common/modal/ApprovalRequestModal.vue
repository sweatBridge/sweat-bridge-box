<template>
  <CModal
    class="close"
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 찾기</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <!-- Search Box -->
      <div class="search-container">
        <CFormInput 
          v-model="searchEmail"
          type="text"
          label="이메일"
          id="emailInput"
          placeholder="이메일을 입력하세요"
        />
        <CButton color="primary" class="search-button" @click="searchUser">
          검색
        </CButton>
      </div>

      <!-- Display User Info (Single User Layout Instead of Table) -->
      <div v-if="user" class="user-info">
        <div class="info-row"><strong>이름:</strong> {{ user.realName }}</div>
        <div class="info-row"><strong>닉네임:</strong> {{ user.nickName }}</div>
        <div class="info-row"><strong>성별:</strong> {{ user.gender }}</div>
        <div class="info-row"><strong>연락처:</strong> {{ user.phone }}</div>
      </div>
    </CModalBody>

    <!-- Footer Button (This was missing before) -->
    <CModalFooter v-if="user">
      <CButton color="success" @click="approveMember()">
        추가
      </CButton>
    </CModalFooter>
  </CModal>
  <approval-confirmation-modal ref="approvalConfirmationModal" />
</template>

<script>

import {ref, onMounted, computed} from "vue"
import { useStore } from "vuex"
import {calculateAge, convertGenderToKorean} from "@/views/admin/util/member"
import ApprovalConfirmationModal from "@/views/admin/common/modal/ApprovalConfirmationModal.vue";
import { CFormInput } from "@coreui/vue";

export default {
  components: {ApprovalConfirmationModal},
  setup({emit}) {
    const store = useStore();
    const modalStatus = ref(false);
    const searchEmail = ref("");
    const user = ref(null);

    const headers = [
      { text: "이름", value: "realName" },
      { text: "닉네임", value: "nickName"},
      { text: "성별", value: "gender" },
      { text: "연락처", value: "phone" },
    ]

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const searchUser = async () => {
      if (!searchEmail.value.trim()) {
        alert("이메일을 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getUserDoc", { email: searchEmail.value });

        console.log("🔍 Debug: User Data from getUserDoc:", userData);

        if (userData) {
          user.value = userData; // ✅ Assign actual user data
          console.log("✅ Debug: User Data Set:", user.value);
        } else {
          user.value = null;
          console.warn("⚠️ Warning: User document does not exist.");
          alert("해당 사용자를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        alert("사용자 검색 중 오류가 발생했습니다.");
      }
    };
    const showModal = () => {
      modalStatus.value = true
    }
    const checkApprovalRequestModal = (result) => {
      modalStatus.value = false
      emit('approvalRequestModalResult', result)
    }

    return {
      modalStatus,
      searchEmail,
      getAge,
      searchUser,
      user,
      headers,
      showModal,
      checkApprovalRequestModal
    };
  },
  methods: {
    approveMember() {
      this.$refs.approvalConfirmationModal.showModal(this.user)
    },
  }
};
</script>

<style scoped>
.search-container {
  display: flex;
  gap: -50px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
}

.search-button {
  white-space: nowrap;
}

.modal-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}

.modal-title {
  color: var(--cui-white)
}
</style>
