<template>
  <CRow>
    <CCol>
      <CCard>
        <CCardHeader class="card-header">
          <strong>회계 관리</strong>
        </CCardHeader>
        <CCardBody>
          <!-- (optional) summary boxes — keep if you want -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">이번 달 매출</div>
              <div class="summary-value">{{ formatKRW(stats.monthRevenue) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">오늘 매출</div>
              <div class="summary-value">{{ formatKRW(stats.todayRevenue) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">이번 달 환불</div>
              <div class="summary-value refund">{{ formatKRW(stats.monthRefund) }}</div>
            </div>
          </div>

          <div class="demo-app-main">
            <FullCalendar
              class="demo-app-calendar"
              ref="fullCalendar"
              :options="calendarOptions"
              style="width: 100%; height: 100%;"
            >
              <!-- identical slot style to your working page -->
              <template #eventContent="arg">
                <b :style="{ color: colorByMethod(arg.event.extendedProps?.method) }">
                  {{ arg.event.title }} 원
                </b>
              </template>
            </FullCalendar>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- different modal -->
  <RevenueDetailModal ref="revenueModal" />
</template>

<script>
import { defineComponent } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import RevenueDetailModal from '@/views/admin/monetary/modal/RevenueDetailModal.vue'

export default defineComponent({
  components: { FullCalendar, RevenueDetailModal },
  data() {
    return {
      rawMonetary: {},
      stats: {
        monthRevenue: 0,
        todayRevenue: 0,
        monthRefund: 0,
      },
      currentEvents: [],
      currentView: 'dayGridMonth',
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth', // keep simple; can add timeGridWeek if you want
        },
        views: {
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: '2-digit' },
          },
        },
        buttonText: { today: '오늘' },
        dayHeaderContent: function (arg) {
          const dayNamesShort = ['일', '월', '화', '수', '목', '금', '토']
          const date = new Date(arg.date)
          // same 1970 trick as your working code
          if (date.getFullYear() === 1970) {
            return dayNamesShort[arg.date.getDay()]
          }
          return `${date.getMonth() + 1}/${date.getDate()}(${dayNamesShort[arg.date.getDay()]})`
        },
        initialView: 'dayGridMonth',
        initialEvents: [],        // we’ll add via API on mount
        editable: false,
        selectable: true,         // for dateClick
        selectMirror: false,
        dayMaxEvents: true,
        weekends: true,
        height: 'parent',
        displayEventTime: false,  // no “12p”
        // hook methods (same pattern as your working page)
        datesSet:  (info) => this.handleDatesSet(info),
        dateClick: (info) => this.handleDateClick(info),
        eventClick:(info) => this.handleEventClick(info),
        eventsSet: (events) => this.handleEvents(events),
      },
    }
  },
  mounted() {
    const api = this.$refs.fullCalendar.getApi()

    // fetch once, cache, then build/add events
    const boxName = localStorage.getItem('boxName')
    const path = `/box/${boxName}/monetary/docs`

    getDoc(doc(db, path)).then((snap) => {
      if (!snap.exists()) return
      const data = snap.data() || {}
      this.rawMonetary = data

      const events = this.buildEvents(data)
      api.removeAllEvents()
      api.addEventSource(events)

      // compute summaries for current visible month
      const anchor = api?.view?.currentStart || api?.view?.activeStart || new Date()
      this.recomputeStatsForMonth(anchor)
    })
  },
  methods: {
    // ===== Helpers identical in spirit to earlier code =====
    colorByMethod(method) {
      if (method === '카드') return 'green'
      if (method === '현금') return 'blue'
      if (method === '환불') return 'red'
      return '#111'
    },
    formatKRW(n) {
      return `${(n || 0).toLocaleString('ko-KR')} 원`
    },
    coercePrice(price) {
      if (typeof price === 'number') return price
      if (!price && price !== 0) return 0
      const cleaned = String(price).replace(/[^\d.-]/g, '')
      const num = parseFloat(cleaned)
      return Number.isFinite(num) ? num : 0
    },
    normalizeDate(v) {
      if (!v) return null
      try { return typeof v.toDate === 'function' ? v.toDate() : new Date(v) } catch { return null }
    },
    buildEvents(dataObj) {
      const events = []
      for (const entry of Object.values(dataObj || {})) {
        const start = this.normalizeDate(entry?.createdAt)
        if (!start) continue
        events.push({
          id: String(start.getTime()) + '_' + String(entry?.price ?? ''), // stable-ish id
          title: String(entry?.price ?? ''),
          start,
          allDay: true,
          extendedProps: { method: entry?.method, realName: entry?.realName },
        })
      }
      return events
    },

    // ===== FullCalendar handlers (same pattern as your working page) =====
    handleDatesSet(info) {
      this.currentView = info.view.type
      const anchor = info.view?.currentStart || info.view?.activeStart || new Date()
      this.recomputeStatsForMonth(anchor)
    },
    handleDateClick(info) {
      this.openDetail(info.date)
    },
    handleEventClick(clickInfo) {
      const when = clickInfo.event?.start || clickInfo.jsEvent?.date
      if (when) this.openDetail(when)
    },
    handleEvents(events) {
      this.currentEvents = events
    },

    // ===== Stats & modal =====
    recomputeStatsForMonth(monthAnchorDate) {
      const dataObj = this.rawMonetary || {}
      const anchor = monthAnchorDate ? new Date(monthAnchorDate) : new Date()

      const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const nextMonthStart = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      let monthRevenue = 0
      let todayRevenue = 0
      let monthRefund = 0

      for (const entry of Object.values(dataObj)) {
        const start = this.normalizeDate(entry?.createdAt)
        const price = this.coercePrice(entry?.price)
        const method = entry?.method
        if (!start || !Number.isFinite(price)) continue

        if (start >= monthStart && start < nextMonthStart) {
          if (method === '환불') {
            monthRefund += price
            monthRevenue -= price
          } else if (method === '카드' || method === '현금') {
            monthRevenue += price
          }
        }
        if (start >= todayStart && start < tomorrowStart) {
          if (method === '환불') todayRevenue -= price
          else if (method === '카드' || method === '현금') todayRevenue += price
        }
      }

      this.stats = { monthRevenue, todayRevenue, monthRefund }
    },

    openDetail(dateObj) {
      const d = new Date(dateObj)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)

      const dayEntries = []
      for (const e of Object.values(this.rawMonetary || {})) {
        const t = this.normalizeDate(e?.createdAt)
        if (!t || t < dayStart || t >= dayEnd) continue
        dayEntries.push({
          price: e?.price,
          method: e?.method,
          realName: e?.realName,
        })
      }
      this.$refs.revenueModal?.showModal(dayStart, dayEntries)
    },
  },
})
</script>

<style scoped lang="scss">
.demo-app {
  display: flex;
  min-height: 100%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.summary-card {
  background: #f7f8fc;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.summary-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.summary-value { font-size: 18px; font-weight: 700; }
.summary-value.refund { color: #ef4444; }

.demo-app-main {
  height: calc(80vh);
  overflow-y: auto;
  flex-grow: 1;
  padding: 3em;
}
.card-header {
  background-color: rgb(70, 100, 200);
  color: #ffffff;
}

:deep(.fc) {
  --fc-event-bg-color: transparent;
  --fc-event-border-color: transparent;
}
</style>
