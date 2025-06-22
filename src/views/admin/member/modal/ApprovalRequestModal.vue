<template>
  <CModal
    class="close"
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 추가</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CTabs active-tab="email">
        <!-- 탭 네비게이션 -->
        <CNav variant="tabs" class="mb-3">
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
          <CNavItem>
            <CNavLink :active="activeTab === 'manual'" @click="setActiveTab('manual')">
              직접 추가
            </CNavLink>
          </CNavItem>
        </CNav>

        <!-- 탭 컨텐츠 -->
        <CTabContent>
          <!-- 이메일 검색 탭 -->
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

          <!-- 직접 추가 탭 -->
          <CTabPane v-if="activeTab === 'manual'" visible>
            <CRow class="align-items-center g-2">
              <CCol md="2">이름</CCol>
              <CCol md="10">
                <CFormInput 
                  v-model="manualName"
                  type="text"
                  id="nameInput"
                  placeholder="이름을 입력하세요."
                />
              </CCol>
            </CRow>
            <CRow class="align-items-center g-2 mt-2">
              <CCol md="2">전화번호</CCol>
              <CCol md="10">
                <CFormInput 
                  v-model="manualPhone"
                  type="text"
                  id="manualPhoneInput"
                  placeholder="전화번호를 입력하세요.(- 제외)"
                />
              </CCol>
            </CRow>
            <CRow class="align-items-center g-2 mt-2">
              <CCol md="2">이메일</CCol>
              <CCol md="10">
                <CFormInput 
                  v-model="manualEmail"
                  type="text"
                  id="manualEmailInput"
                  placeholder="e-mail 입력하세요."
                />
              </CCol>
            </CRow>
            <CRow class="align-items-center g-2 mt-2">
              <CCol md="2">성별</CCol>
              <CCol md="10">
                <CButtonGroup>
                  <CButton color="primary" :variant="manualGender === 'M' ? '' : 'outline'" @click="setManualGender('M')">
                    남
                  </CButton>
                  <CButton color="primary" :variant="manualGender === 'F' ? '' : 'outline'" @click="setManualGender('F')">
                    여
                  </CButton>
                </CButtonGroup>
              </CCol>
            </CRow>
            <CRow class="mt-3">
              <CCol class="text-end">
                <CButton color="success" @click="addManualMember">
                  추가
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
            <CListGroupItem>
              <strong>박스:</strong> {{ user.boxName }}
              <span v-if="isBoxMember()"><strong> [이미 추가된 회원]</strong></span>
            </CListGroupItem>
            <CListGroupItem><strong>이름:</strong> {{ user.realName }}</CListGroupItem>
            <CListGroupItem><strong>닉네임:</strong> {{ user.nickName }}</CListGroupItem>
            <CListGroupItem><strong>성별:</strong> {{ getGender(user.gender) }}</CListGroupItem>
            <CListGroupItem><strong>연락처:</strong> {{ user.phone }}</CListGroupItem>
            <CListGroupItem><strong>이메일:</strong> {{ user.email }}</CListGroupItem>
          </CListGroup>
        </CCardBody>
        <CCardFooter class="text-end">
          <CButton color="success" @click="addMember()" :disabled="isBoxMember()">
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
import ApprovalConfirmationModal from "@/views/admin/member/modal/ApprovalConfirmationModal.vue";

export default {
  components: {ApprovalConfirmationModal},
  setup({emit}) {
    const boxName = ref(localStorage.getItem('boxName') || '');

    const store = useStore();
    const modalStatus = ref(false);
    const activeTab = ref('email');
    const searchEmail = ref("");
    const searchPhone = ref("");

    const manualName = ref("");
    const manualPhone = ref("");
    const manualEmail = ref("");
    const manualGender = ref("");
    const user = ref(null);

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

    const setManualGender = (gender) => {
      manualGender.value = gender;
    };


    const searchUserByEmail = async () => {
      if (!searchEmail.value.trim()) {
        alert("이메일을 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getUserByEmail", { email: searchEmail.value });

        if (userData) {
          user.value = userData;
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
    const searchUserByPhone = async () => {
      if (!searchPhone.value.trim()) {
        alert("전화번호를 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getUserByPhone", { phone: searchPhone.value });

        if (userData) {
          user.value = userData;
        } else {
          user.value = null;
          console.warn("⚠️ Warning: User document does not exist.");
          alert("해당 사용자를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        alert("사용자 검색 중 오류가 발생했습니다.");
      }
    }

    const isBoxMember = () => user.value.boxName === boxName.value

    
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
      setManualGender,
      manualName,
      manualPhone,
      manualEmail,
      manualGender,
      getAge,
      getGender,
      searchUserByEmail,
      searchUserByPhone,
      isBoxMember,
      user,
      showModal,
      checkApprovalRequestModal
    };
  },
  methods: {
    addMember() {
      this.$refs.approvalConfirmationModal.showModal(this.user, 'auto')
    },
    addManualMember() {
      this.$refs.approvalConfirmationModal.showModal({
        'boxName': this.boxName,
        'email': this.manualEmail,
        'gender': this.manualGender,
        'phone': this.manualPhone,
        'realName': this.manualName,
        'nickName': this.manualName,
        'remain': {}
      }, 'manual')
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
