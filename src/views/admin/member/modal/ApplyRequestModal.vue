<template>
  <CModal
    :visible="modalStatus"
    @close="() => (modalStatus = false)"
    size="lg"
  >
    <CModalHeader class="modal-header">
      <CModalTitle>승인 대기 목록</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CTable>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell scope="col">이름</CTableHeaderCell>
            <CTableHeaderCell scope="col">이메일</CTableHeaderCell>
            <CTableHeaderCell scope="col">전화번호</CTableHeaderCell>
            <CTableHeaderCell scope="col" class="text-center">승인여부</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="(applicant, index) in applicants" :key="index">
            <CTableDataCell>{{ applicant.name }}</CTableDataCell>
            <CTableDataCell>{{ applicant.email }}</CTableDataCell>
            <CTableDataCell>{{ applicant.phone }}</CTableDataCell>
            <CTableDataCell class="text-center">
              <CButton color="success" size="sm" @click="approveApplicant(applicant)">
                ✓
              </CButton>
              <CButton color="danger" size="sm" class="ms-2" @click="rejectApplicant(applicant)">
                X
              </CButton>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="modalStatus = false">닫기</CButton>
    </CModalFooter>
  </CModal>
  <toast-message ref="toastMessageRef" />
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import ToastMessage from '@/views/admin/common/toast/ToastMessage.vue';

export default {
  name: 'ApplyRequestModal',
  components: { ToastMessage },
  setup(props, { expose }) {
    const modalStatus = ref(false);
    const applicants = ref([]);
    const store = useStore();
    const toastMessageRef = ref(null);
    const boxName = ref(localStorage.getItem('boxName') || '');

    const showModal = async () => {
      modalStatus.value = true;
      await loadApplicants();
    };

    const loadApplicants = async () => {
      const result = await store.dispatch('fetchApplicants', boxName.value);
      applicants.value = result;
    };

    const approveApplicant = async (applicant) => {
      const payload = { email: applicant.email };
      const userDoc = await store.dispatch('getUserByEmail', payload);
      try {
        if (!userDoc.boxName?.startsWith('?')) return;
        userDoc.boxName = userDoc.boxName.slice(1);
        await store.dispatch('removeApplication', {
          email: applicant.email,
          boxName: userDoc.boxName,
        });
        if (userDoc.hasOwnProperty('memberships')) {
          delete userDoc.memberships;
        }
        await store.dispatch('createMember', userDoc);
        toastMessageRef.value.createToast({
          title: '성공',
          content: '회원 추가 성공',
          type: 'success',
        });
      } catch (error) {
        toastMessageRef.value.createToast({
          title: '실패',
          content: '회원 추가 실패: ' + error,
          type: 'danger',
        });
      }
    };

    const rejectApplicant = async (applicant) => {
      try {
        await store.dispatch('rejectApplicant', {
          email: applicant.email,
          boxName: applicant.boxName,
        });
        toastMessageRef.value.createToast({
          title: '성공',
          content: '거절 성공',
          type: 'success',
        });
      } catch (error) {
        toastMessageRef.value.createToast({
          title: '실패',
          content: '거절 실패: ' + error,
          type: 'danger',
        });
      }
    };

    expose({ showModal });

    return {
      modalStatus,
      applicants,
      toastMessageRef,
      showModal,
      approveApplicant,
      rejectApplicant,
    };
  },
};
</script>

<style scoped>
.modal-header {
  background-color: #4664c8;
  color: white;
}
</style>
