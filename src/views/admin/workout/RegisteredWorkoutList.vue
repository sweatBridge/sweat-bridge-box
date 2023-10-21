<template>
  <CCard>
    <CCardHeader>
      <strong>등록 와드 목록</strong>
    </CCardHeader>
    <CCardBody>
      <div class="demo-app-main">
        <FullCalendar class="demo-app-calendar" ref="fullCalendarRef" :options="calendarOptions" style="width: 100%; height: 650px;">
          <template v-slot:eventContent="arg">
            <b>{{ arg.timeText }}</b>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      </div>
    </CCardBody>
  </CCard>

</template>

<script>
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
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const fullCalendarRef = ref(null)

    const moveToModifyPage = (clickInfo) => {
      store.commit('setRegisteredWod', clickInfo.event.extendedProps.data)
      router.push("/admin/registerd-wod")
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
        right: 'dayGridMonth',
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
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      initialEvents: INITIAL_REGISTERD_WODS,
      eventClick: moveToModifyPage,
      /* you can update a remote database when these fire:
      select: this.handleDateSelect,
      eventClick: this.handleEventClick,
      eventsSet: this.handleEvents, // called after events are initialized/added/changed/removed
      eventAdd:
      eventChange:
      eventRemove:
      */
    })
    return {
      fullCalendarRef,
      calendarOptions,
      moveToModifyPage,
    }
  }
})
</script>

<style scoped>

</style>
