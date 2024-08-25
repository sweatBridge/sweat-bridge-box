<template>
    <CModal
      :visible="modalStatus"
      @close="closeModal"
    >
      <CModalHeader class="modal-header">
        <CModalTitle>와드 요약</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <pre>{{ wodSummary }}</pre>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal">
          닫기
        </CButton>
      </CModalFooter>
    </CModal>
  </template>
  
  <script>
  import { ref, watch } from "vue";
  import { generateWodSummary } from "../../util/workout";
  import store from "@/store";
  
  export default {
    name: "WodSummaryModal",
    setup() {
      const modalStatus = ref(false);
      const wodSummary = ref("");
  
      const updateWodSummary = () => {
        wodSummary.value = generateWodSummary(store.state.workout.registeredWod);
      };
  
      const showModal = () => {
        updateWodSummary();  // 모달을 열 때마다 WOD 요약 업데이트
        modalStatus.value = true;
      };
  
      const closeModal = () => {
        modalStatus.value = false;
      };
  
      return {
        modalStatus,
        wodSummary,
        showModal,
        closeModal,
      };
    }
  };
  </script>
  
  <style scoped>
  .modal-title {
    color: var(--cui-white);
  }
  .modal-header {
    background-color: var(--cui-info);
  }
  .modal-body pre {
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 1rem;
  }
  </style>
  