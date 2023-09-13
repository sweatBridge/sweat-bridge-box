<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>
          <strong>수업 등록</strong>
        </CCardHeader>
        <CCardBody>
          <div class="demo-app-main">
            <FullCalendar class="demo-app-calendar" ref="fullCalendar" :options="calendarOptions">
              <template v-slot:eventContent="arg">
                <b>{{ arg.timeText }}</b>
                <i>{{ arg.event.title }}</i>
              </template>
            </FullCalendar>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCard>
      <CCardBody>
        <CButton color="primary" @click="dbTest"> DB Button </CButton>
        <CButton color="primary" @click="dbTest2"> DB Button </CButton>
      </CCardBody>
    </CCard>
  </CRow>
  <save-class-modal
    ref="saveModal"
    purpose="ClassReservation"
    @saveModalResult="checkSaveModalResult"
  />
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {INITIAL_EVENTS, createEventId, extractDateAndTime} from './classCalendarUtils'
import { defineComponent } from 'vue'
import SaveClassModal from '@/views/admin/common/modal/SaveClassModal.vue'
import {mapActions, mapState} from "vuex";

export default defineComponent({
  components: {
    SaveClassModal,
    FullCalendar,
  },
  mounted() {
    // console.log(calendarApi.view.activeStart)
    // console.log(calendarApi.view.activeEnd)
    this.getMonthlyClasses({
      calendarApi: this.$refs.fullCalendar.getApi(),
      box: 'CFBD',
    })
  },
  computed: {
    classes() {
      return this.$store.getters.getClasses
    },
  },
  data() {
    return {
      calendarOptions: {
        plugins: [
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin, // needed for dateClick
        ],
        customButtons: {
          // myCustomButton: {
          //   text: 'custom!',
          //   click: function() {
          //     alert('clicked the custom button!');
          //   }
          // }
        },
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        },
        views: {
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: '2-digit' }
          },
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
          },
          timeGridDay: {
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
          }
        },
        // dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
        // dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
        initialView: 'timeGridWeek',
        initialEvents: INITIAL_EVENTS, // alternatively, use the `events` setting to fetch from a feed
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents,
        eventAdd: this.handleEventAdd,
        eventChange: this.handleEventChange,
        eventRemove: this.handleEventRemove,
      },
      currentEvents: [],
    }
  },
  methods: {
    ...mapActions(['getDailyClasses', 'getClass', 'setClass', 'getMonthlyClasses', 'addClass', 'getClassDoc']),
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends // update a property
    },
    //TODO : 순서 load -> modal 응답 -> checkSaveModalResult -> addEvent -> handleEventAdd
    handleDateSelect(selectInfo) {
      this.loadSaveModal(selectInfo)
      //TODO : 복원 가능
      let calendarApi = selectInfo.view.calendar
      // calendarApi.unselect() // clear date selection
    },
    handleEventClick(clickInfo) {
      if (
        confirm(
          `Are you sure you want to delete the event '${clickInfo.event.title}'`,
        )
      ) {
        clickInfo.event.remove()
      }
      console.log(clickInfo)
    },
    handleEvents(events) {
      this.currentEvents = events
    },
    handleEventAdd(event) {
      console.log('handle event add')
      console.log(event)
    },
    handleEventChange(event) {
      console.log('handle event change')
      console.log(event)
    },
    handleEventRemove(event) {
      console.log('handle event remove')
      console.log(event)
    },
    loadSaveModal(selectInfo) {
      console.log('loadSaveModal')
      this.$refs.saveModal.showModal(selectInfo)
    },
    checkSaveModalResult(modalResult) {
      console.log('checkSaveModalResult')
      if (modalResult.status) {
        this.saveClass(modalResult)
      }
    },
    async saveClass(result) {
      let calendarApi = this.$refs.fullCalendar.getApi()
      const startDt = extractDateAndTime(result.startStr)
      const endDt = extractDateAndTime(result.endStr)
      const box = 'CFBD'
      if (startDt.date !== endDt.date) {
        return
      }
      this.setClass({
        docKey: startDt.date + startDt.time + endDt.time,
        box: box,
        coach: result.coach,
        cap: parseInt(result.capacity, 10)
      })
        .then(() => {
          calendarApi.addEvent({
            id: createEventId(),
            title: box + " WOD",
            start: result.startStr,
            end: result.endStr,
            extendedProps: {
              coach: result.coach,
              capacity: result.capacity,
            }
          })
        })
        .catch(error => {
          console.error('Failed to set class', error);
        })
    },
    // test buttion 1
    async dbTest() {
      // this.getMonthlyClasses()
      // let calendarApi = this.$refs.fullCalendar.getApi()
      // calendarApi.next()
      let calendarApi = this.$refs.fullCalendar.getApi()
      const clases = this.$store.getters.getClasses
      console.log(clases)
      for (let i = 1; i <= clases.length; i++) {
        calendarApi.addEvent({
          id: createEventId(),
          title: clases.title,
          start: clases.start,
          end: clases.end
        })
      }
    },
    // test buttion 2
    async dbTest2() {
      // let todayStr = new Date().toISOString().replace(/T.*$/, '')
      // let calendarApi = this.$refs.fullCalendar.getApi()
      // calendarApi.addEvent({
      //   id: "abc",
      //   title: 'test & test',
      //   start: todayStr + 'T18:00:00',
      //   end: todayStr + 'T20:00:00'
      // })
      // console.log(calendarApi)
      // console.log(this.currentEvents)
      this.addClass({
        calendarApi: this.$refs.fullCalendar.getApi(),
      })

    },
    createTimeDocId(start, end) {
      return `${start}${end}`
    },
  },
})
</script>

<style scoped lang="scss">
.demo-app {
  display: flex;
  min-height: 100%;
  font-family:
    Arial,
    Helvetica Neue,
    Helvetica,
    sans-serif;
  font-size: 14px;
}

.demo-app-main {
  flex-grow: 1;
  padding: 3em;
}
</style>
