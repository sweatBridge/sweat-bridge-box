<template>
  <CModal
    :visible="modalStatus"
    @close="() => {modalStatus = false}"
    size="xl"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>회원 기록 추가</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <!-- 검색 섹션 -->
      <CTabs active-tab="name">
        <!-- 탭 네비게이션 -->
        <CNav variant="tabs" class="mb-3">
          <CNavItem>
            <CNavLink :active="activeTab === 'name'" @click="setActiveTab('name')">
              이름으로 찾기
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink :active="activeTab === 'nickname'" @click="setActiveTab('nickname')">
              닉네임으로 찾기
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
          <!-- 이름 검색 탭 -->
          <CTabPane v-if="activeTab === 'name'" visible>
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

          <!-- 닉네임 검색 탭 -->
          <CTabPane v-if="activeTab === 'nickname'" visible>
            <CRow class="align-items-center g-2">
              <CCol md="2">닉네임</CCol>
              <CCol md="8">
                <CFormInput 
                  v-model="searchNickname"
                  type="text"
                  id="nicknameInput"
                  placeholder="닉네임을 입력하세요."
                />
              </CCol>
              <CCol md="2">
                <CButton color="primary" class="search-button" @click="searchUserByNickname">
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
                  id="manualNameInput"
                  placeholder="이름을 입력하세요."
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
            <CRow class="align-items-center g-2 mt-2">
              <CCol md="2">RxD</CCol>
              <CCol md="10">
                <CButtonGroup>
                  <CButton color="primary" :variant="isRxd === true ? '' : 'outline'" @click="isRxd = true">
                    Yes
                  </CButton>
                  <CButton color="primary" :variant="isRxd === false ? '' : 'outline'" @click="isRxd = false">
                    No
                  </CButton>
                </CButtonGroup>
              </CCol>
            </CRow>
            <CRow class="align-items-center g-2 mt-2">
              <CCol md="2">기록</CCol>
              <CCol md="10">
                <CFormInput 
                  v-model="recordInput"
                  type="text"
                  placeholder="기록을 입력하세요"
                />
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

      <!-- 검색 결과 -->
      <div v-if="!selectedUser">
        <div v-if="searchResults.length > 0" class="mt-3">
          <CCard v-for="(user, index) in searchResults" :key="index" class="border-dark mb-3">
            <CCardHeader class="bg-light fw-bold">검색 결과 {{index + 1}}</CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem><strong>박스:</strong> {{ user.boxName }}</CListGroupItem>
                <CListGroupItem><strong>이름:</strong> {{ user.realName }}</CListGroupItem>
                <CListGroupItem><strong>닉네임:</strong> {{ user.nickName }}</CListGroupItem>
                <CListGroupItem><strong>성별:</strong> {{ getGender(user.gender) }}</CListGroupItem>
                <CListGroupItem><strong>연락처:</strong> {{ user.phone }}</CListGroupItem>
              </CListGroup>
            </CCardBody>
            <CCardFooter class="text-end">
              <CButton color="success" @click="selectUser(user)">
                선택
              </CButton>
            </CCardFooter>
          </CCard>
        </div>
      </div>

      <!-- 선택된 사용자 기록 입력 섹션 -->
      <div v-else>
        <div class="mt-3">
          <CCard class="border-dark">
            <CCardHeader class="bg-light fw-bold">기록 입력</CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem><strong>박스:</strong> {{ selectedUser.boxName }}</CListGroupItem>
                <CListGroupItem><strong>이름:</strong> {{ selectedUser.realName }}</CListGroupItem>
                <CListGroupItem><strong>닉네임:</strong> {{ selectedUser.nickName }}</CListGroupItem>
                <CListGroupItem><strong>성별:</strong> {{ getGender(selectedUser.gender) }}</CListGroupItem>
                <CListGroupItem><strong>연락처:</strong> {{ selectedUser.phone }}</CListGroupItem>
              </CListGroup>
              <CRow class="mt-3">
                <CCol>
                  <CFormInput
                    v-model="recordInput"
                    type="text"
                    placeholder="기록을 입력하세요"
                  />
                </CCol>
              </CRow>
              <CRow class="mt-3">
                <CCol>
                  <div class="d-flex align-items-center">
                    <span class="me-3">RxD:</span>
                    <CButtonGroup>
                      <CButton color="primary" :variant="isRxd === true ? '' : 'outline'" @click="isRxd = true">
                        Yes
                      </CButton>
                      <CButton color="primary" :variant="isRxd === false ? '' : 'outline'" @click="isRxd = false">
                        No
                      </CButton>
                    </CButtonGroup>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
            <CCardFooter class="text-end">
              <CButton color="secondary" class="me-2" @click="cancelSelection">
                취소
              </CButton>
              <CButton color="success" @click="saveRecord">
                저장
              </CButton>
            </CCardFooter>
          </CCard>
        </div>
      </div>
    </CModalBody>
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import {useStore} from "vuex";
import {ref} from "vue";
import {convertGenderToKorean} from "@/views/admin/util/member";
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";

export default {
  name: "RegisterUserRecordModal",
  components: {
    ToastMessage
  },
  setup() {
    const store = useStore()
    const modalStatus = ref(false)
    const activeTab = ref('name')
    const searchName = ref("")
    const searchNickname = ref("")
    const searchResults = ref([])
    const selectedUser = ref(null)
    const recordInput = ref("")
    const isRxd = ref(null)
    const currentWodId = ref(null)
    const toastMessageRef = ref(null)

    // 직접 추가를 위한 필드들
    const manualName = ref("")
    const manualNickname = ref("")
    const manualPhone = ref("")
    const manualGender = ref("")

    const setActiveTab = (tab) => {
      activeTab.value = tab
      searchResults.value = []
      selectedUser.value = null
      searchName.value = ""
      searchNickname.value = ""
    }

    const setManualGender = (gender) => {
      manualGender.value = gender
    }

    const getGender = (gender) => {
      return convertGenderToKorean(gender)
    }

    const searchUserByName = async () => {
      if (!searchName.value.trim()) {
        alert("이름을 입력하세요.")
        return
      }

      try {
        const users = await store.dispatch("getUserByRealName", { realName: searchName.value })
        if (users && users.length > 0) {
          searchResults.value = users
        } else {
          searchResults.value = []
          alert("해당 이름의 사용자를 찾을 수 없습니다.")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        alert("사용자 검색 중 오류가 발생했습니다.")
      }
    }

    const searchUserByNickname = async () => {
      if (!searchNickname.value.trim()) {
        alert("닉네임을 입력하세요.")
        return
      }

      try {
        const users = await store.dispatch("getUserByNickName", { nickName: searchNickname.value })
        if (users && users.length > 0) {
          searchResults.value = users
        } else {
          searchResults.value = []
          alert("해당 닉네임의 사용자를 찾을 수 없습니다.")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        alert("사용자 검색 중 오류가 발생했습니다.")
      }
    }

    const selectUser = (user) => {
      selectedUser.value = user
      searchResults.value = []
    }

    const cancelSelection = () => {
      selectedUser.value = null
      recordInput.value = ""
    }

    const saveRecord = async () => {
      if (!recordInput.value.trim()) {
        alert("기록을 입력해주세요.")
        return
      }
      if (isRxd.value === null) {
        alert("RxD 여부를 선택해주세요.")
        return
      }

      try {
        await store.dispatch("addUserRecord", {
          wodId: currentWodId.value,
          user: selectedUser.value,
          record: recordInput.value,
          isRxd: isRxd.value
        })
        toastMessageRef.value.createToast({
          title: '성공',
          content: '기록이 성공적으로 저장되었습니다.',
          type: 'success'
        })
        setTimeout(() => {
          location.reload()
        }, 500)
        modalStatus.value = false
      } catch (error) {
        console.error("Error saving record:", error)
        toastMessageRef.value.createToast({
          title: '실패',
          content: '기록 저장 중 오류가 발생했습니다.',
          type: 'danger'
        })
      }
    }

    const addManualMember = async () => {
      if (!manualName.value.trim()) {
        alert("이름을 입력해주세요.")
        return
      }
      if (!manualGender.value) {
        alert("성별을 선택해주세요.")
        return
      }
      if (!recordInput.value.trim()) {
        alert("기록을 입력해주세요.")
        return
      }
      if (isRxd.value === null) {
        alert("RxD 여부를 선택해주세요.")
        return
      }

      try {
        await store.dispatch("addManualRecord", {
          wodId: currentWodId.value,
          realName: manualName.value,
          gender: manualGender.value,
          isRxd: isRxd.value,
          score: recordInput.value
        })
        toastMessageRef.value.createToast({
          title: '성공',
          content: '기록이 성공적으로 저장되었습니다.',
          type: 'success'
        })
        setTimeout(() => {
          location.reload()
        }, 500)
        modalStatus.value = false
      } catch (error) {
        console.error("Error saving manual record:", error)
        toastMessageRef.value.createToast({
          title: '실패',
          content: '기록 저장 중 오류가 발생했습니다.',
          type: 'danger'
        })
      }
    }

    const showModal = (wodId) => {
      currentWodId.value = wodId
      modalStatus.value = true
    }

    return {
      modalStatus,
      activeTab,
      searchName,
      searchNickname,
      searchResults,
      selectedUser,
      recordInput,
      isRxd,
      currentWodId,
      toastMessageRef,
      manualName,
      manualNickname,
      manualPhone,
      manualGender,
      setActiveTab,
      setManualGender,
      getGender,
      searchUserByName,
      searchUserByNickname,
      selectUser,
      cancelSelection,
      saveRecord,
      addManualMember,
      showModal
    }
  }
}
</script>

<style scoped>
.modal-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}

.search-button {
  white-space: nowrap;
}
</style>
