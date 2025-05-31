<template>
  <CRow style="width: 100%">
    <CCol sm="8">
      <CCard>
        <CCardHeader>
          <strong>등록 와드 목록</strong>&nbsp;

          <CTooltip content="날짜를 클릭해 와드를 등록해요!" placement="top">
            <template #toggler="{ on }">
              <CButton class="header-button" v-on="on" size="sm">
                <CIcon icon="cil-star" size="sm" />&nbsp;
<!--                <CIcon class="tips-icon" name="cil-s" />-->
                <strong>Tips</strong>
              </CButton>
            </template>
          </CTooltip>
          <div class="float-end">
            <CButton
              class="position-relative header-button" size="sm" @click="moveToRegisterPage">
              <strong>추가</strong>
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>

          <div class="demo-app-main">
            <FullCalendar class="demo-app-calendar" ref="fullCalendarRef" :options="calendarOptions" style="width: 100%; height: 100%;">
              <template v-slot:eventContent="arg">
                <b>{{ arg.timeText }}</b>
                <i>{{ arg.event.title }}</i>
              </template>
            </FullCalendar>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
    <CCol sm="4">
      <CRow>
        <CCol sm="12">
          <CCard>
            <CCardHeader class="card-header">
              <strong>{{wodTitle}} 와드</strong>
              <div class="float-end">
                <CButton class="position-relative custom-button" size="sm" shape="rounded-pill"
                  @click="handleWodSummary" v-if="wodTitle !== ''">
                  <strong>요약</strong>
                </CButton>
                <CButton color="light" class="position-relative" size="sm" shape="rounded-pill"
                  @click="moveToModifyPage" v-if="wodTitle !== ''">
                  <strong>수정</strong>
                </CButton>
              </div>
            </CCardHeader>
          </CCard>
        </CCol>
        <CCol sm="12">
          <CCard>
            <CCardHeader>
              <strong>회원 기록 </strong>
              <div class="float-end">
                <CButton
                  class="position-relative header-button" size="sm" @click="handleRecordClick">
                  <strong>전체 기록</strong>
                  <CBadge color="danger" position="top-end" shape="rounded-pill">
                    {{records.length}} <span class="visually-hidden">member record</span>
                  </CBadge>
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <member-record :records="records" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm="12">
          <CCard>
            <CCardHeader>
              <strong>회원 피드백</strong>
              <div class="float-end">
                <CButton
                  class="position-relative header-button" size="sm" @click="handleFeedbackClick">
                  <strong>전체 피드백</strong>
                  <CBadge color="danger" position="top-end" shape="rounded-pill">
                    {{feedbacks.length}} <span class="visually-hidden">member feedback</span>
                  </CBadge>
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <member-feedback :feedbacks="feedbacks" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CCol>
  </CRow>
  <workout-modify-modal ref="workoutModifyModalRef" />
  <wod-summary-modal ref="wodSummaryModalRef" />
  <user-record-modal ref="userRecordModalRef" />
  <user-feedback-modal ref="userFeedbackModalRef" />
  <event-alert ref="eventAlertRef" />
</template>

<script>
import MemberFeedback from "@/views/admin/workout/MemberFeedback.vue"
import MemberRecord from "@/views/admin/workout/MemberRecord.vue"
import FullCalendar from '@fullcalendar/vue3'
import {computed, defineComponent, onMounted, reactive, ref} from "vue"
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {INITIAL_REGISTERD_WODS} from '@/views/admin/class/classCalendarUtils'
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import WorkoutModifyModal from "@/views/admin/common/modal/WorkoutModifyModal.vue";
import EventAlert from "@/views/admin/common/toast/EventAlert.vue";
import UserFeedbackModal from "@/views/admin/common/modal/UserFeedbackModal.vue";
import UserRecordModal from "@/views/admin/workout/modal/UserRecordModal.vue";
import WodSummaryModal from "../common/modal/WodSummaryModal.vue"
export default defineComponent({
  name: "RegisteredWorkoutList",
  components: {
    UserRecordModal,
    UserFeedbackModal,
    EventAlert,
    WorkoutModifyModal,
    WodSummaryModal,
    FullCalendar,
    MemberFeedback,
    MemberRecord,
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const fullCalendarRef = ref(null)
    const wodTitle = ref("")
    const currentWodId = ref(null)
    const workoutModifyModalRef = ref(null)
    const userRecordModalRef = ref(null)
    const userFeedbackModalRef = ref(null)
    const wodSummaryModalRef = ref(null);
    const eventAlertRef = ref(null)
    const records = computed(() => store.state.workout.registeredWod.records || [])
    const feedbacks = computed(() => store.state.record.feedbacks)
    const boxName = ref(localStorage.getItem('boxName') || '')

    const moveToModifyPage = () => {
      workoutModifyModalRef.value.showModal()
    }

    const moveToRegisterPage = (selectInfo) => {
      if (selectInfo !== null) {
        store.commit('setSelectedDate', selectInfo.start)
      }
      router.push("/admin/wod/register")
    }

    const handleWodSummary = () => {
      wodSummaryModalRef.value.showModal();
    }

    const handleEventClick = (clickInfo) => {
      store.commit('setRegisteredWod', clickInfo.event)
      store.dispatch('getWodRecords', clickInfo.event.id)
      const title = clickInfo.event.title;
      wodTitle.value = title
      currentWodId.value = clickInfo.event.id
      eventAlertRef.value.createToast({
        content: `${title} 와드를 선택하셨습니다.`,
      })
    }

    const handleRecordClick = () => {
      userRecordModalRef.value.showModal(currentWodId.value)
    }

    const handleFeedbackClick = () => {
      userFeedbackModalRef.value.showModal()
    }

    onMounted(() => {
      if (fullCalendarRef.value && fullCalendarRef.value.getApi) {
        store.dispatch('getRecentRegisteredWodList', {
          calendarApi: fullCalendarRef.value.getApi(),
          box: boxName.value
        })
      }
    })

    const calendarOptions = ref({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'title',
        center: '',
        right: 'prev,next',
      },
      views: {
        dayGridMonth: {
          titleFormat: {year: 'numeric', month: '2-digit'},
        },
      },
      dayHeaderContent: function(arg) {
        let dayNamesShort = ['일', "월", "화", "수", "목", "금", "토"]
        return dayNamesShort[arg.date.getDay()]
      },
      editable: false,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      initialEvents: INITIAL_REGISTERD_WODS,
      eventClick: handleEventClick,
      select: moveToRegisterPage,
    })
    return {
      fullCalendarRef,
      wodTitle,
      currentWodId,
      workoutModifyModalRef,
      eventAlertRef,
      userRecordModalRef,
      userFeedbackModalRef,
      wodSummaryModalRef,
      records,
      feedbacks,
      calendarOptions,
      moveToModifyPage,
      moveToRegisterPage,
      handleWodSummary,
      handleRecordClick,
      handleFeedbackClick
    }
  }
})
</script>

<style scoped>
.card-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}

.custom-button {
  background-color: rgba(140, 170, 230, 0.98);
  color: #000000;
}

.header-button {
  background-color: #ffffff;
  color: rgb(70, 100, 200)
}

.fc,
.fc * {
  user-select: none !important;
  caret-color: transparent !important;
}

</style>
