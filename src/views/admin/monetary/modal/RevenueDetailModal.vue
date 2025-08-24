<template>
  <CModal :visible="modalStatus" @close="() => (modalStatus = false)" size="lg" scrollable>
    <CModalHeader>
      <CModalTitle>{{ formattedDate }} 매출 상세</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <!-- 4 summary boxes -->
      <div class="summary-grid four">
        <div class="summary-card">
          <div class="summary-label">카드 매출</div>
          <div class="summary-value">{{ formatKRW(cardSum) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">현금 매출</div>
          <div class="summary-value">{{ formatKRW(cashSum) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">환불</div>
          <div class="summary-value refund">{{ formatKRW(refundSum) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">순매출</div>
          <div class="summary-value">{{ formatKRW(netSum) }}</div>
        </div>
      </div>

      <!-- Entries list -->
      <div class="entry-list">
        <div v-for="(e, i) in entries" :key="i" class="entry-row">
          <div class="entry-price" :class="methodClass(e.method)">
            {{ formatKRW(coercePrice(e.price)) }}
          </div>
          <div class="entry-meta">
            <div class="entry-method">{{ e.method || '-' }}</div>
            <div class="entry-name">{{ e.realName || '-' }}</div>
          </div>
        </div>
        <div v-if="entries.length === 0" class="entry-empty">
          해당 날짜의 데이터가 없습니다.
        </div>
      </div>
    </CModalBody>
  </CModal>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'RevenueDetailModal',
  setup() {
    const modalStatus = ref(false)
    const date = ref(null)
    const entries = ref([])

    // public method: parent will call this via ref
    const showModal = (selectedDate, dayEntries) => {
      date.value = selectedDate ? new Date(selectedDate) : new Date()
      entries.value = Array.isArray(dayEntries) ? dayEntries : []
      modalStatus.value = true
    }

    const coercePrice = (price) => {
      if (typeof price === 'number') return price
      if (!price && price !== 0) return 0
      const num = parseFloat(String(price).replace(/[^\d.-]/g, ''))
      return Number.isFinite(num) ? num : 0
    }
    const formatKRW = (n) => `${(n || 0).toLocaleString('ko-KR')} 원`
    const formattedDate = computed(() => {
      if (!date.value) return ''
      const y = date.value.getFullYear()
      const m = String(date.value.getMonth() + 1).padStart(2, '0')
      const d = String(date.value.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    })

    const sumByMethod = (method) =>
      entries.value
        .filter((e) => e?.method === method)
        .reduce((acc, e) => acc + coercePrice(e?.price), 0)

    const cardSum = computed(() => sumByMethod('카드'))
    const cashSum = computed(() => sumByMethod('현금'))
    const refundSum = computed(() => sumByMethod('환불'))
    const netSum = computed(() => cardSum.value + cashSum.value - refundSum.value)

    const methodClass = (method) => {
      if (method === '카드') return 'is-card'
      if (method === '현금') return 'is-cash'
      if (method === '환불') return 'is-refund'
      return ''
    }

    return {
      modalStatus,
      date,
      entries,
      showModal,
      coercePrice,
      formatKRW,
      formattedDate,
      cardSum,
      cashSum,
      refundSum,
      netSum,
      methodClass,
    }
  },
}
</script>

<style scoped>
.summary-grid.four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.summary-card {
  background: #f7f8fc;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.summary-value {
  font-size: 18px;
  font-weight: 700;
}
.summary-value.refund { color: #ef4444; }

.entry-list { margin-top: 14px; display: grid; gap: 10px; }
.entry-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border: 1px solid #e5e7eb;
  border-radius: 10px; background: #fff;
}
.entry-price { font-size: 20px; font-weight: 800; min-width: 140px; }
.entry-meta { display: flex; flex-direction: column; gap: 2px; }
.entry-method { font-size: 13px; color: #6b7280; }
.entry-name { font-size: 14px; }

.entry-price.is-card { color: #22c55e; }
.entry-price.is-cash { color: #3b82f6; }
.entry-price.is-refund { color: #ef4444; }

.entry-empty {
  padding: 16px; text-align: center; color: #6b7280;
  border: 1px dashed #e5e7eb; border-radius: 10px;
}
</style>
