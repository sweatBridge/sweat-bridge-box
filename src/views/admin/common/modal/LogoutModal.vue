<template>
    <CModal
      :visible="modalStatus"
      @close="() => {modalStatus = false}"
    >
      <CModalHeader class="modal-header">
        <CModalTitle>로그아웃</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <strong>{{nickName}}</strong> 님 로그아웃 하시겠습니까?
      </CModalBody>
      <CModalFooter>
        <CButton color="danger" @click="cancel">
          취소
        </CButton>
        <CButton color="success" @click="logout">
          확인
        </CButton>
      </CModalFooter>
    </CModal>
    <toast-message ref="toastMessageRef" />
  
  </template>
  
  <script>
  import {ref} from "vue"
  import {useStore} from "vuex"
  import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue";
  import router from "@/router";
  
  export default {
    name: "LogoutModal",
    components: {ToastMessage},
    setup(props, { emit }) {
      const store = useStore()
      const modalStatus = ref(false)
      const toastMessageRef = ref(null)
      const nickName = ref(localStorage.getItem('nickName') || '');
  
      const showModal = (user) => {
        modalStatus.value = true
      }
      const logout = () => {
        modalStatus.value = false

        try {
            store.dispatch('logout')
            toastMessageRef.value.createToast({
                title: '성공',
                content: '로그아웃 성공',
                type: 'success'
            });
            store.commit('SET_BOX_STATE_EMPTY')
            setTimeout(() => {
                router.push("/pages/login")
            }, 500)
        } catch (error) {
            console.log('로그아웃 실패 : ' + error.meessage)
            toastMessageRef.value.createToast({
                title: '실패',
                content: '로그아웃 실패',
                type: 'danger'
            })
        }
        
        
      }
      const cancel = () => {
        modalStatus.value = false
      }
  
      return {
        modalStatus,
        nickName,
        toastMessageRef,
        showModal,
        logout,
        cancel,
      }
    },
  }
  
  </script>
  
  <style scoped>
  .modal-title {
    color: var(--cui-white)
  }
  .modal-header {
    background-color: var(--cui-warning);
  }
  </style>
  