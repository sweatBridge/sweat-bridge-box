<template>
  <CRow style="width: 110%">
    <CCol sm="8">
      <CCard>
        <CCardHeader>
          <strong>등록 와드 목록 </strong>
          <CTooltip content="달력에서 일자 클릭 시 해당 일자 와드 등록 가능" placement="top">
            <template #toggler="{ on }">
              <CButton color="warning" v-on="on" size="sm">Tips!</CButton>
            </template>
          </CTooltip>
          <div class="float-end">
            <CButton
              color="light" class="position-relative" size="sm" @click="moveToRegisterPage">
              추가
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
              <strong>{{workoutDateStr}} 와드</strong>
              <div class="float-end">
                <CButton class="position-relative custom-button" size="sm" shape="rounded-pill"
                         v-if="workoutDateStr !== ''">
                  요약
                </CButton>
                <CButton color="light" class="position-relative" size="sm" shape="rounded-pill"
                  @click="moveToModifyPage" v-if="workoutDateStr !== ''">
                  수정
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
                  color="light" class="position-relative" size="sm">
                  전체 기록
                  <CBadge color="danger" position="top-end" shape="rounded-pill">
                    {{26}} <span class="visually-hidden">member record</span>
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
                  color="light" class="position-relative" size="sm" @click="handleFeedbackClick">
                  전체 피드백
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
import {extractDateInKorean} from "@/views/admin/util/date";
import WorkoutModifyModal from "@/views/admin/common/modal/WorkoutModifyModal.vue";
import EventAlert from "@/views/admin/common/toast/EventAlert.vue";
import UserFeedbackModal from "@/views/admin/common/modal/UserFeedbackModal.vue";
export default defineComponent({
  name: "RegisteredWorkoutList",
  components: {
    UserFeedbackModal,
    EventAlert,
    WorkoutModifyModal,
    FullCalendar,
    MemberFeedback,
    MemberRecord,
  },
  setup() {
    const shortWod = ref("For Time\n" +
      "3 Rounds\n" +
      "15 Wall Ball(20/14)\n" +
      "15 Deadlift(185/125)\n" +
      "15 Box Jump Over(24/20)\n")
    const router = useRouter()
    const store = useStore()
    const fullCalendarRef = ref(null)
    const workoutDateStr = ref("")
    const workoutModifyModalRef = ref(null)
    const userFeedbackModalRef = ref(null)
    const eventAlertRef = ref(null)
    const feedbacks = computed(() => store.state.record.records)

    const moveToModifyPage = () => {
      // store.commit('setRegisteredWod', clickInfo.event)
      // router.push("/admin/registerd-wod")
      workoutModifyModalRef.value.showModal()
    }

    const moveToRegisterPage = (selectInfo) => {
      if (selectInfo !== null) {
        store.commit('setSelectedDate', selectInfo.start)
      }
      router.push("/admin/wod/register")
    }

    const handleEventClick = (clickInfo) => {
      store.commit('setRegisteredWod', clickInfo.event)
      store.dispatch('getRecords', clickInfo.event.id)
      const dateStrKor = extractDateInKorean(clickInfo.event.startStr)
      workoutDateStr.value = dateStrKor
      eventAlertRef.value.createToast({
        content: `${dateStrKor} 와드를 선택하셨습니다.`,
      })
    }

    const handleFeedbackClick = () => {
      userFeedbackModalRef.value.showModal()
    }

    onMounted(() => {
      if (fullCalendarRef.value && fullCalendarRef.value.getApi) {
        store.dispatch('getRecentRegisteredWodList', {
          calendarApi: fullCalendarRef.value.getApi(),
          box: 'CFBD',
        })
      }
    })

    const calendarOptions = ref({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'title',
        center: '',
        right: '',
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
      /* you can update a remote database when these fire:
      select: this.handleDateSelect,
      eventClick: this.handleEventClick,
      eventsSet: this.handleEvents, // called after events are initialized/added/changed/removed
      eventAdd:
      eventChange:
      eventRemove:
      */
    })

    const records = ref([
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
      {name: "김대현", level: "RXD", record: "06:54"},
    ])
    return {
      shortWod,
      fullCalendarRef,
      workoutDateStr,
      workoutModifyModalRef,
      eventAlertRef,
      userFeedbackModalRef,
      feedbacks,
      calendarOptions,
      moveToModifyPage,
      moveToRegisterPage,
      records,
      handleFeedbackClick
    }
  }
})
</script>

<style scoped>
.card-header {
  background-color: rgb(76, 192, 115);
  color: var(--cui-white);
}

.custom-button {
  background-color: rgba(216, 230, 82, 0.98);
  color: #011d2a;
}

</style>
