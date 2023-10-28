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
              <strong>오늘의 와드</strong>
              <div class="float-end">
                <CButton class="position-relative custom-button" size="sm" shape="rounded-pill">
                  요약
                </CButton>
                <CButton
                  color="light" class="position-relative" size="sm" shape="rounded-pill">
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
                  color="light" class="position-relative" size="sm">
                  전체 피드백
                  <CBadge color="danger" position="top-end" shape="rounded-pill">
                    {{13}} <span class="visually-hidden">member feedback</span>
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


</template>

<script>
import MemberFeedback from "@/views/admin/workout/MemberFeedback.vue"
import MemberRecord from "@/views/admin/workout/MemberRecord.vue"
import FullCalendar from '@fullcalendar/vue3'
import {defineComponent, onMounted, ref} from "vue"
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {INITIAL_REGISTERD_WODS} from '@/views/admin/class/classCalendarUtils'
import {useRouter} from "vue-router";
import {useStore} from "vuex";
export default defineComponent({
  name: "RegisteredWorkoutList",
  components: {
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

    const moveToModifyPage = (clickInfo) => {
      store.commit('setRegisteredWod', clickInfo.event)
      router.push("/admin/registerd-wod")
    }

    const moveToRegisterPage = (selectInfo) => {
      if (selectInfo !== null) {
        store.commit('setSelectedDate', selectInfo.start)
      }
      router.push("/admin/wod/register")
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
      eventClick: moveToModifyPage,
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

    const feedbacks = ref([
      {
        name: "김대현",
        feedback: "오늘 와드는 초보자가 따라가기에 너무 어려웠어요. 다음에 자세히 설명해주세요"
      },
      {
        name: "김재인",
        feedback: "데드리프트 때 어떤 무게를 들어야할지 모르겠어요"
      },
      {
        name: "박솔희",
        feedback: "8:30 수업에 사람이 너무 많아요"
      },
      {
        name: "김대현",
        feedback: "오늘 와드는 초보자가 따라가기에 너무 어려웠어요. 다음에 자세히 설명해주세요"
      },
      {
        name: "김재인",
        feedback: "데드리프트 때 어떤 무게를 들어야할지 모르겠어요"
      },
      {
        name: "박솔희",
        feedback: "8:30 수업에 사람이 너무 많아요"
      },
      {
        name: "김대현",
        feedback: "오늘 와드는 초보자가 따라가기에 너무 어려웠어요. 다음에 자세히 설명해주세요"
      },
      {
        name: "김재인",
        feedback: "데드리프트 때 어떤 무게를 들어야할지 모르겠어요"
      },
      {
        name: "박솔희",
        feedback: "8:30 수업에 사람이 너무 많아요"
      },
    ])

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
      calendarOptions,
      moveToModifyPage,
      moveToRegisterPage,
      feedbacks,
      records,
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
