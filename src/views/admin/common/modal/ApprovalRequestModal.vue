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
      <CTabs active-tab="email">
        <!-- 탭 네비게이션 -->
        <CNav variant="tabs">
          <CNavItem>
            <CNavLink :active="activeTab === 'email'" @click="setActiveTab('email')">
              이메일로 찾기
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink :active="activeTab === 'phone'" @click="setActiveTab('phone')">
              전화번호로 찾기
            </CNavLink>
          </CNavItem>
        </CNav>

        <!-- 이메일 검색 탭 -->
        <CTabContent>
          <CTabPane v-if="activeTab === 'email'" visible>
            <CRow class="align-items-center g-2">
              <CCol md="2">이메일</CCol>
              <CCol md="8">
                <CFormInput 
                  v-model="searchEmail"
                  type="text"
                  id="emailInput"
                  placeholder="이메일을 입력하세요."
                />
              </CCol>
              <CCol md="2">
                <CButton color="primary" class="search-button" @click="searchUserByEmail">
                  검색
                </CButton>
              </CCol>
            </CRow>
          </CTabPane>

          <!-- 전화번호 검색 탭 -->
          <CTabPane v-if="activeTab === 'phone'" visible>
            <CRow class="align-items-center g-2">
              <CCol md="2">전화번호</CCol>
              <CCol md="8">
                <CFormInput 
                  v-model="searchPhone"
                  type="text"
                  id="phoneInput"
                  placeholder="핸드폰 번호를 입력하세요.(- 제외)"
                />
              </CCol>
              <CCol md="2">
                <CButton color="primary" class="search-button" @click="searchUserByPhone">
                  검색
                </CButton>
              </CCol>
            </CRow>
          </CTabPane>
        </CTabContent>
      </CTabs>

      <CCard class="border-dark mt-3" v-if="user">
        <CCardHeader class="bg-light fw-bold">검색 결과</CCardHeader>
        <CCardBody>
          <CListGroup flush>
            <CListGroupItem><strong>이름:</strong> {{ user.realName }}</CListGroupItem>
            <CListGroupItem><strong>닉네임:</strong> {{ user.nickName }}</CListGroupItem>
            <CListGroupItem><strong>성별:</strong> {{ getGender(user.gender) }}</CListGroupItem>
            <CListGroupItem><strong>연락처:</strong> {{ user.phone }}</CListGroupItem>
          </CListGroup>
        </CCardBody>
        <CCardFooter class="text-end">
          <CButton color="success" @click="approveMember()">
            추가
          </CButton>
        </CCardFooter>
      </CCard>
    </CModalBody>

    <CModalFooter>
      <CButton color="danger" @click="() => {modalStatus = false}">
        닫기
      </CButton>
    </CModalFooter>
  </CModal>
  <approval-confirmation-modal ref="approvalConfirmationModal" />
</template>

<script>

import {ref} from "vue"
import { useStore } from "vuex"
import {calculateAge, convertGenderToKorean} from "@/views/admin/util/member"
import ApprovalConfirmationModal from "@/views/admin/common/modal/ApprovalConfirmationModal.vue";
import { CFormInput } from "@coreui/vue";

export default {
  components: {ApprovalConfirmationModal},
  setup({emit}) {
    const store = useStore();
    const modalStatus = ref(false);
    const activeTab = ref('email');
    const searchEmail = ref("");
    const searchPhone = ref("");
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

    const getGender = (gender) => {
      return convertGenderToKorean(gender)
    }

    const setActiveTab = (tab) => {
      activeTab.value = tab;
      user.value = '';
      searchEmail.value = '';
      searchPhone.value = '';
    }

    const searchUserByEmail = async () => {
      if (!searchEmail.value.trim()) {
        alert("이메일을 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getUserByEmail", { email: searchEmail.value });

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
    const searchUserByPhone = async () => {}
    
    const showModal = () => {
      modalStatus.value = true
    }
    const checkApprovalRequestModal = (result) => {
      modalStatus.value = false
      emit('approvalRequestModalResult', result)
    }

    return {
      modalStatus,
      activeTab,
      searchEmail,
      searchPhone,
      setActiveTab,
      getAge,
      getGender,
      searchUserByEmail,
      searchUserByPhone,
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
