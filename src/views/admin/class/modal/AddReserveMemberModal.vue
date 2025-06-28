<template>
  <CModal
    class="close"
    :visible="modalStatus"
    backdrop="static"
    @close="() => {modalStatus = false}"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 추가</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CTabs active-tab="activeTab">
        <!-- 탭 네비게이션 -->
        <CNav variant="tabs" class="mb-3">
          <CNavItem>
            <CNavLink :active="activeTab === 'realName'" @click="setActiveTab('realName')">
              이름으로 찾기
            </CNavLink>
          </CNavItem>
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

        <!-- 탭 컨텐츠 -->
        <CTabContent>
          <!-- 이름 검색 탭 -->
          <CTabPane v-if="activeTab === 'realName'" visible>
            <CRow class="align-items-center g-2">
              <CCol md="2">이름</CCol>
              <CCol md="8">
                <CFormInput 
                  v-model="searchName"
                  type="text"
                  id="nameInput"
                  placeholder="이름을 입력하세요."
                />
              </CCol>
              <CCol md="2">
                <CButton color="primary" class="search-button" @click="searchUserByName">
                  검색
                </CButton>
              </CCol>
            </CRow>
          </CTabPane>

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
        </CTabContent>
      </CTabs>

      <!-- Results Area -->
      <div class="mt-3">
        <!-- Single user -->
        <CCard v-if="user" class="border-dark">
          <CCardHeader class="bg-light fw-bold">검색 결과</CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem><strong>이름:</strong> {{ user.realName }} <span v-if="isClassMember(user)"><strong>[이미 추가된 회원]</strong></span></CListGroupItem>
              <CListGroupItem><strong>연락처:</strong> {{ user.phone }}</CListGroupItem>
              <CListGroupItem><strong>이메일:</strong> {{ user.email }}</CListGroupItem>
            </CListGroup>
          </CCardBody>
          <CCardFooter class="text-end">
            <CButton color="success" @click="addMember(user)" :disabled="isClassMember(user)">추가</CButton>
          </CCardFooter>
        </CCard>

        <!-- Multiple users -->
        <template v-else-if="users?.length > 0">
          <CCard
            v-for="(u, index) in users"
            :key="index"
            class="border-dark mb-3"
          >
            <CCardHeader class="bg-light fw-bold">검색 결과</CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem><strong>이름:</strong> {{ u.realName }} <span v-if="isClassMember(u)"><strong>[이미 추가된 회원]</strong></span></CListGroupItem>
                <CListGroupItem><strong>연락처:</strong> {{ u.phone }}</CListGroupItem>
                <CListGroupItem><strong>이메일:</strong> {{ u.email }}</CListGroupItem>
              </CListGroup>
            </CCardBody>
            <CCardFooter class="text-end">
              <CButton color="success" @click="addMember(u)" :disabled="isClassMember(u)">추가</CButton>
            </CCardFooter>
          </CCard>
        </template>
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton color="danger" @click="() => {modalStatus = false}">
        닫기
      </CButton>
    </CModalFooter>
  </CModal>
  <wod-confirmation-modal ref="wodConfirmationModalRef" />
</template>

<script>
import {ref} from "vue"
import { useStore } from "vuex"
import {calculateAge, convertGenderToKorean} from "@/views/admin/util/member"
import WodConfirmationModal from "@/views/admin/class/modal/WodConfirmationModal.vue";

export default {
  components: {WodConfirmationModal},
    props: {
        classmembers: {
        type: Array,
        required: true,
        }
    },
  setup(props, context) {
    const boxName = ref(localStorage.getItem('boxName') || '');
    const store = useStore();
    const modalStatus = ref(false);
    const activeTab = ref('realName');
    const searchName = ref("");
    const searchEmail = ref("");
    const searchPhone = ref("");
    const user = ref(null);
    const users = ref([]); //유저가 여러명일 경우
    const wodConfirmationModalRef = ref(null);
    const classId = ref("")
    const date = ref("")

    const getAge = (birthDate) => {
      return calculateAge(birthDate)
    }

    const getGender = (gender) => {
      return convertGenderToKorean(gender)
    }

    const setActiveTab = (tab) => {
      activeTab.value = tab;
      user.value = '';
      users.value = [];
      searchName.value = '';
      searchEmail.value = '';
      searchPhone.value = '';
    }

    const searchUserByName = async () => {
      console.log(searchName, "searchname")
      if (!searchName.value.trim()) {
        alert("이름을 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getWodUserByName", { realName: searchName.value, boxName: boxName.value});
        if (userData) {
          users.value = userData;
          user.value = null;
        } else {
          users.value = [];
          user.value = null;
          console.warn("⚠️ Warning: User document does not exist.");
          alert("해당 사용자를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        alert("사용자 검색 중 오류가 발생했습니다.");
      }
    };

    const searchUserByEmail = async () => {
      console.log(searchEmail, "searchemail")
      if (!searchEmail.value.trim()) {
        alert("이메일을 입력하세요.");
        return;
      }

      try {
        // Call Vuex action to get user data
        const userData = await store.dispatch("getWodUserByEmail", { email: searchEmail.value, boxName: boxName.value});
        if (userData) {
          user.value = userData;
          users.value = [];
        } else {
          user.value = null;
          users.value = [];
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
        const userData = await store.dispatch("getUserByPhone", { phone: searchPhone.value, boxName: boxName});
        if (userData) {
          user.value = userData;
          users.value = [];
        } else {
          user.value = null;
          users.value = [];
          console.warn("⚠️ Warning: User document does not exist.");
          alert("해당 사용자를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        alert("사용자 검색 중 오류가 발생했습니다.");
      }
    }

    const isClassMember = (targetUser) => {
      if (!targetUser?.email || !Array.isArray(props.classmembers)) return false;
      return props.classmembers.some(r => r.email === targetUser.email);
    };

    const showModal = (selectedClass, selectedDate) => {
    modalStatus.value = true
    classId.value = selectedClass
    date.value = selectedDate
    }

    const checkApprovalRequestModal = (result) => {
      modalStatus.value = false
      emit('approvalRequestModalResult', result)
    }


    const addMember = (targetUser) => {
      if (!wodConfirmationModalRef.value || !targetUser) return;
      wodConfirmationModalRef.value.showModal(
        targetUser,
        classId.value,
        date.value
      );
    };

    return {
      modalStatus,
      activeTab,
      searchName,
      searchEmail,
      searchPhone,
      setActiveTab,
      getAge,
      getGender,
      searchUserByName,
      searchUserByEmail,
      searchUserByPhone,
      isClassMember,
      user,
      users,
      showModal,
      checkApprovalRequestModal,
      addMember,
      wodConfirmationModalRef,
      classId,
      date,
    };
  },
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