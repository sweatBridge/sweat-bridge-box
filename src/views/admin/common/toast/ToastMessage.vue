<template>
  <CToaster placement="top-end" visible>
    <CToast v-for="(toast, index) in toasts" :key="index" :visible="true">
      <CToastHeader closeButton :class="toast.headerClass">
        <span class="me-auto fw-bold">{{toast.title}}</span>
<!--        <small>7 min ago</small>-->
      </CToastHeader>
      <CToastBody :class="toast.bodyClass">
        {{ toast.content }}
      </CToastBody>
    </CToast>

  </CToaster>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ToastComponent',

  setup() {
    const toasts = ref([])

    const createToast = (payload) => {
      let type = payload.type || 'info'

      toasts.value.push({
        title: payload.title,
        content: payload.content,
        headerClass: `toast-header-${type}`,
        bodyClass: `toast-body-${type}`
      })
    }

    return {
      toasts,
      createToast
    }
  }
})
</script>

<style scoped>
.toast-header-success {
  background-color : chartreuse;
  color: black;
}
.toast-body-success {
  background-color : var(--cui-success);
  color: aliceblue;
}
.toast-header-danger {
  background-color : coral;
  color: black;
}
.toast-body-danger {
  background-color : var(--cui-danger);
  color: aliceblue;
}
.toast-header-info {
  background-color : white;
  color: black;
}
.toast-body-info {
  background-color : var(--cui-secondary);
  color: black;
}
</style>
