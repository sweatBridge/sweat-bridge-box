<template>
  <CModal
    :visible="modalStatus"
    @close="
      () => {
        modalStatus = false
      }
    "
  >
    <CModalHeader>
      <CModalTitle>{{ getSubject }} 등록</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">시작 시각</CInputGroupText>
        <template v-if="calendarView === 'dayGridMonth'">
          <CFormInput
            id="basic-url"
            aria-describedby="basic-addon3"
            type="datetime-local"
            v-model="startStr"
            :value="startStr"
          />
        </template>
        <template v-else-if="calendarView === 'timeGridWeek'">
          <CFormInput
            id="basic-url"
            aria-describedby="basic-addon3"
            v-model="startStrKst"
            readonly
          />
        </template>
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">종료 시각</CInputGroupText>
        <template v-if="calendarView === 'dayGridMonth'">
          <CFormInput
            id="basic-url"
            aria-describedby="basic-addon3"
            type="datetime-local"
            v-model="endStr"
            :value="endStr"
          />
        </template>
        <template v-else-if="calendarView === 'timeGridWeek'">
          <CFormInput
            id="basic-url"
            aria-describedby="basic-addon3"
            v-model="endStrKst"
            readonly
          />
        </template>
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">코치</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="this.coach"
        />
      </CInputGroup>
      <CInputGroup class="mb-3">
        <CInputGroupText id="basic-addon3">정원</CInputGroupText>
        <CFormInput
          id="basic-url"
          aria-describedby="basic-addon3"
          v-model="this.capacity"
        />
      </CInputGroup>
      <hr />
      <CRow>
        <CCol sm="auto">
          <CButton
            color="info"
            size="sm"
            v-c-popover="{
              header: '수업 자동 등록',
              content: 'Popover body content is set in this property.',
            }"
          >
            Tips
          </CButton>
        </CCol>
        <CCol sm="auto">
          <CFormCheck
            name="flexCheckDefault"
            id="flexCheckDefault"
            label="이 수업 4주간 동일하게 적용"
            v-model="this.isMonthlySchedule"
          />
        </CCol>
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="checkSaveModalResult(false)"
        >취소</CButton
      >
      <CButton color="success" @click="checkSaveModalResult(true)"
        >저장</CButton
      >
    </CModalFooter>
  </CModal>
</template>
<script>
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CFormCheck,
  CRow,
  CCol,
} from '@coreui/vue'
import { computed, defineComponent, ref, toRefs } from 'vue'
import { formatDateTime } from '../../util/date';

export default defineComponent({
  components: {
    CFormInput,
    CInputGroupText,
    CInputGroup,
    CModalBody,
    CModalFooter,
    CModalTitle,
    CModalHeader,
    CModal,
    CButton,
    CFormCheck,
    CRow,
    CCol,
  },
  props: {
    purpose: {
      type: String,
    },
    currentView: {
      type: String,
      default: 'timeGridWeek'
    }
  },
  setup(props, { emit }) {
    const { currentView: calendarView } = toRefs(props)
    const modalStatus = ref(false)
    const startStr = ref('')
    const endStr = ref('')
    const startStrKst = ref('')
    const endStrKst = ref('')
    const coach = ref('')
    const capacity = ref(0)
    const isMonthlySchedule = ref(false)

    const getSubject = computed(() => {
      switch (props.purpose) {
        case 'ClassReservation':
          return '수업'
        default:
          return ''
      }
    })

    const getTitleSubject = computed(() => {
      switch (props.purpose) {
        case 'ClassReservation':
          return 'Class Reservation'
        default:
          return ''
      }
    })

    const showModal = (selectInfo) => {
      modalStatus.value = true
      startStr.value = selectInfo.startStr
      endStr.value = selectInfo.endStr
      startStrKst.value = formatDateTime(selectInfo.startStr);
      endStrKst.value = formatDateTime(selectInfo.endStr);
    }

    const checkSaveModalResult = (status) => {
      if (status && capacity.value <= 0) {
        if (typeof window !== 'undefined' && window.$toastMessageRef) {
          window.$toastMessageRef.createToast({
            title: '오류',
            content: '정원이 1명 이상이어야 수업 예약이 가능합니다.',
            type: 'danger'
          })
        } else {
          alert('정원이 1명 이상이어야 수업 예약이 가능합니다.')
        }
        return
      }
      let result = {
        status: status,
        coach: coach.value,
        capacity: capacity.value,
        startStr: startStr.value,
        endStr: endStr.value,
        isMonthlySchedule: isMonthlySchedule.value,
      }
      modalStatus.value = false
      emit('saveModalResult', result)
    }

    return {
      modalStatus,
      getSubject,
      getTitleSubject,
      startStrKst,
      endStrKst,
      coach,
      capacity,
      isMonthlySchedule,
      startStr,
      endStr,
      showModal,
      checkSaveModalResult,
      calendarView
    }
  },
})
</script>
