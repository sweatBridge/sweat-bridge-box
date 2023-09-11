<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>
          <strong>수업 등록</strong>
        </CCardHeader>
        <CCardBody>
          <div class="demo-app-main">
            <FullCalendar class="demo-app-calendar" :options="calendarOptions">
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
import { INITIAL_EVENTS, createEventId } from './event-utils'
import { defineComponent } from 'vue'
import SaveClassModal from '@/views/admin/common/modal/SaveClassModal.vue'
import {mapActions} from "vuex";

export default defineComponent({
  components: {
    SaveClassModal,
    FullCalendar,
  },
  data() {
    return {
      calendarOptions: {
        plugins: [
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin, // needed for dateClick
        ],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        },
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
    ...mapActions(['getDailyClasses', 'getClass', 'setClass']),
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends // update a property
    },
    //TODO : 순서 load -> modal 응답 -> checkSaveModalResult -> addEvent -> handleEventAdd
    handleDateSelect(selectInfo) {
      this.loadSaveModal(selectInfo)
      // let title = prompt('Please enter a new title for your event')
      //TODO : 복원 가능
      // let title = 'abc'
      // let calendarApi = selectInfo.view.calendar
      //
      // calendarApi.unselect() // clear date selection
      //
      // if (title) {
      //   calendarApi.addEvent({
      //     id: createEventId(),
      //     title: title,
      //     start: selectInfo.startStr,
      //     end: selectInfo.endStr,
      //     allDay: selectInfo.allDay,
      //   })
      // }
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
            end: result.endStr
          })
        })
        .catch(error => {
          console.error('Failed to set class', error);
        })
    },
    async dbTest() {
      try {
        // await this.getDailyClasses()
        await this.setClass()
      } catch (error) {
        console.error('An error occurred:', error);
      }
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
