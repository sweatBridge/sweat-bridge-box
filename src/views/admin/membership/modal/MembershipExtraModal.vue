<template>
  <!-- Render only when visible, above the parent modal -->
  <Teleport to="body" v-if="visible">
    <div class="d-block" style="position: fixed; inset: 0; z-index: 1060;">
      <!-- Local backdrop -->
      <div class="modal-backdrop fade show" @click="onNo"></div>

      <!-- Centered dialog -->
      <div
        class="modal d-block"
        style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;"
        @keydown.esc.prevent.stop="onNo"
        tabindex="0"
        ref="dialogEl"
      >
        <div class="modal-dialog" :class="mode === 'refund' ? 'modal-sm' : 'modal-sm'">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ mode === 'refund' ? '환불하기' : '회원권 삭제' }}
              </h5>
              <button type="button" class="btn-close" aria-label="Close" @click="onNo"></button>
            </div>

            <!-- 삭제 확인 -->
            <div v-if="mode === 'delete'" class="modal-body">
              결제 내역은 전액 환불 후 회원권이 삭제됩니다. 정말 삭제하시겠습니까?
            </div>

            <!-- 환불 폼 -->
            <div v-else class="modal-body">
              <div class="mb-3">
                <label class="form-label">환불 사유</label>
                <input
                  type="text"
                  class="form-control"
                  v-model.trim="refundForm.reason"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">환불 금액</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="refundForm.amount"
                  min="0"
                  step="1"
                />
              </div>
              <div class="mb-0">
                <label class="form-label">담당자</label>
                <input
                  type="text"
                  class="form-control"
                  v-model.trim="refundForm.assignee"
                />
              </div>
            </div>

            <div class="modal-footer justify-content-between">
              <button type="button" class="btn btn-secondary" @click="onNo">취소</button>

              <!-- 삭제 버튼 -->
              <button
                v-if="mode === 'delete'"
                type="button"
                class="btn btn-danger"
                :disabled="loading"
                @click="onYes"
              >
                {{ loading ? '처리 중…' : '예' }}
              </button>

              <!-- 환불 버튼 -->
              <button
                v-else
                type="button"
                class="btn btn-primary"
                :disabled="loading || !isRefundValid"
                @click="onRefund"
                title="사유/금액/담당자를 모두 입력해야 합니다"
              >
                {{ loading ? '처리 중…' : '환불' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const visible = ref(false)
const loading = ref(false)
const mode = ref('delete') // 'delete' | 'refund'
const payload = reactive({ index: null, email: '' })
const dialogEl = ref(null)

// 환불 폼 상태
const refundForm = reactive({
  reason: '',
  amount: null,
  assignee: '',
})

const isRefundValid = computed(() => {
  const hasReason = !!refundForm.reason
  const hasAssignee = !!refundForm.assignee
  const validAmount = typeof refundForm.amount === 'number' && refundForm.amount >= 0
  return hasReason && hasAssignee && validAmount
})

function resetRefundForm () {
  refundForm.reason = ''
  refundForm.amount = null
  refundForm.assignee = ''
}

function open({ index, email, mode: openMode = 'delete' }) {
  payload.index = index
  payload.email = email
  mode.value = openMode
  if (openMode === 'refund') resetRefundForm()
  visible.value = true
  // simple focus trap
  nextTick(() => dialogEl.value?.focus())
}
function close() {
  visible.value = false
  loading.value = false
  payload.index = null
  payload.email = ''
  mode.value = 'delete'
  resetRefundForm()
}

const emit = defineEmits(['deleted', 'failed', 'refunded'])

async function onYes() {
  if (payload.index == null || !payload.email) return
  loading.value = true
  try {
    await store.dispatch('removeUserMembership', {
      index: payload.index,
      email: payload.email,
    })
    emit('deleted', { index: payload.index, email: payload.email })
    close()
  } catch (err) {
    emit('failed', err)
    close()
  }
}

async function onRefund() {
  if (!isRefundValid.value || payload.index == null || !payload.email) return
  loading.value = true
  try {
    emit('refunded', {
      index: payload.index,
      email: payload.email,
      reason: refundForm.reason,
      amount: refundForm.amount,
      assignee: refundForm.assignee,
    })
    close()
  } catch (err) {
    emit('failed', err)
    close()
  }
}

function onNo() {
  close()
}

defineExpose({ open, close })
</script>
