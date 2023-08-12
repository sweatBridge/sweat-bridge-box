<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader>
          <strong>리타게팅 대상 트래커 등록</strong>
        </CCardHeader>
        <CCardBody>
          <FullCalendar :options="calendarOptions" />
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
export default {
  name: 'ClassReservation',
  components: {
    FullCalendar,
  },
  setup() {
    const calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
    }
    return {
      calendarOptions,
    }
  },
}
</script>
