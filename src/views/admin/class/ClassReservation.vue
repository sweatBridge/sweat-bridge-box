<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader class="card-header">
          <strong>수업 등록</strong>
        </CCardHeader>
        <CCardBody>
          <div class="demo-app-main">
            <FullCalendar class="demo-app-calendar" ref="fullCalendar" :options="calendarOptions" style="width: 100%; height: 650px;">
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
  <save-class-modal
    ref="saveModal"
    purpose="ClassReservation"
    @saveModalResult="checkSaveModalResult"
  />
  <manage-class-modal
    ref="manageModal"
    @updateModalResult="updateClass"
    @deleteModalResult="deleteClass"
  />
  <toast-message ref="toastMessageRef" />

</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {INITIAL_EVENTS, extractDateAndTime} from './classCalendarUtils'
import { defineComponent } from 'vue'
import SaveClassModal from '@/views/admin/class/modal/SaveClassModal.vue'
import {mapActions} from "vuex";
import ManageClassModal from "@/views/admin/class/modal/ManageClassModal.vue"
import ToastMessage from "@/views/admin/common/toast/ToastMessage.vue"

export default defineComponent({
  components: {
    ManageClassModal,
    SaveClassModal,
    FullCalendar,
    ToastMessage,
  },
  mounted() {
    // console.log(calendarApi.view.activeStart)
    // console.log(calendarApi.view.activeEnd)
    const boxName = localStorage.getItem('boxName');
    this.getMonthlyClasses({
      calendarApi: this.$refs.fullCalendar.getApi(),
      box: boxName,
    });
  },
  computed: {},
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
            titleFormat: { year: 'numeric', month: '2-digit' },
          },
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
          },
          timeGridDay: {
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
          }
        },
        buttonText: {
          today: '오늘',
          month: '월',
          week: '주',
          day: '일'
        },
        dayHeaderContent: function(arg) {
          let dayNamesShort = ['일', "월", "화", "수", "목", "금", "토"]
          let date = new Date(arg.date)
          // this if branch for dayGridMonth view
          if (date.getFullYear() == 1970) {
            return dayNamesShort[arg.date.getDay()]
          }
          let dateStr = `${date.getMonth()+1}/${date.getDate()}(${dayNamesShort[arg.date.getDay()]})`
          return dateStr
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
      height: 200,
      width: 200,
    }
  },
  methods: {
    ...mapActions(['getClass', 'setClass', 'getMonthlyClasses', 'update', 'delete']),
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends // update a property
    },
    //TODO : 순서 load -> modal 응답 -> checkSaveModalResult -> addEvent -> handleEventAdd
    handleDateSelect(selectInfo) {
      this.loadSaveModal(selectInfo)
    },
    handleEventClick(clickInfo) {
      this.loadManageModal(clickInfo.event)
    },
    handleEvents(events) {
      this.currentEvents = events
    },
    // event 추가 시 호출
    handleEventAdd(event) {},
    // event 상태 변경 시 호출
    handleEventChange(event) {},
    // event 삭제 시 호출
    handleEventRemove(event) {},
    loadSaveModal(selectInfo) {
      this.$refs.saveModal.showModal(selectInfo)
    },
    loadManageModal(event) {
      this.$refs.manageModal.showModal(event)
    },
    checkSaveModalResult(modalResult) {
      if (modalResult.status) {
        this.saveClasses(modalResult)
      }
    },
    async updateClass(result) {
      let calendarApi = this.$refs.fullCalendar.getApi()
      const box = localStorage.getItem('boxName');
      this.update({
        docKey: result.id,
        box: box,
        coach: result.coach,
        cap: parseInt(result.capacity, 10),
        reserved: result.reserved,
      }).then(() => {
          // calendarApi.getEventById(result.id).setExtendedProp('coach', result.coach)
          // calendarApi.getEventById(result.id).setExtendedProp('cap', result.capacity)
          this.$refs.toastMessageRef.createToast({
            title: '성공',
            content: '수업 정보 변경 성공',
            type: 'success'
          })
          setTimeout(() => {
            location.reload()
          }, 1000)
        }
      ).catch(error => {
        console.error('Failed to update class', error);
        this.$refs.toastMessageRef.createToast({
          title: '실패',
          content: '수업 정보 변경 실패 error: ' + error.message,
          type: 'danger'
        })
        setTimeout(() => {
          location.reload()
        }, 1000)
      })
    },
    async deleteClass(result) {
      let calendarApi = this.$refs.fullCalendar.getApi()
      const box = localStorage.getItem('boxName');
      this.delete({
        docKey: result.id,
        box: box,
      }).then(() => {
        // calendarApi.getEventById(result.id).remove()
        this.$refs.toastMessageRef.createToast({
          title: '성공',
          content: '수업 삭제 성공',
          type: 'success'
        })
        setTimeout(() => {
          location.reload()
        }, 1000)
      }).catch(error => {
        console.error('Failed to delete class', error)
        this.$refs.toastMessageRef.createToast({
          title: '실패',
          content: '수업 삭제 실패 error: ' + error.message,
          type: 'danger'
        })
        setTimeout(() => {
          location.reload()
        }, 1000)
      })
    },
    async saveClasses(result) {
      if (result.isMonthlySchedule) {
        let startDt = new Date(result.startStr)
        let endDt = new Date(result.endStr)
        console.log(startDt, endDt)
        for (let i = 0; i < 4; i++) {
          const startStr = new Date(startDt.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
          const endStr = new Date(endDt.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
          console.log(startStr, endStr)
          result.startStr = startStr
          result.endStr = endStr
          console.log(result)
          this.saveClass(result)

          // 다음 주로 날짜 조정
          startDt.setTime(startDt.getTime() + 7 * 24 * 60 * 60 * 1000)
          endDt.setTime(endDt.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      } else {
        this.saveClass(result)
      }
    },
    saveClass(result) {
      let calendarApi = this.$refs.fullCalendar.getApi()
      const startDt = extractDateAndTime(result.startStr)
      const endDt = extractDateAndTime(result.endStr)
      const box = localStorage.getItem('boxName');
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
          this.$refs.toastMessageRef.createToast({
            title: '성공',
            content: '수업 등록 성공',
            type: 'success'
          })
          setTimeout(() => {
            location.reload()
          }, 1000)
          // calendarApi.addEvent({
          //   id: createEventId(),
          //   title: box + " WOD",
          //   start: result.startStr,
          //   end: result.endStr,
          //   extendedProps: {
          //     coach: result.coach,
          //     cap: parseInt(result.capacity, 10),
          //     reserved: result.reserved,
          //   }
          // })
        })
        .catch(error => {
          console.error('Failed to set class', error);
          this.$refs.toastMessageRef.createToast({
            title: '실패',
            content: '수업 등록 실패 error: ' + error.message,
            type: 'danger'
          })
          setTimeout(() => {
            location.reload()
          }, 1000)
        })
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
.card-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}
</style>
