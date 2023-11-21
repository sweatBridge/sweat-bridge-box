<template>
  <CToaster placement="top-end" visible>
    <CToast v-for="(toast, index) in toasts" :key="index" :visible="true">
      <div class="d-flex toast-body">
        <CToastBody class="toast-body">{{toast.content}}</CToastBody>
        <CToastClose class="me-2 m-auto toast-close"/>
      </div>
    </CToast>
  </CToaster>
</template>

<script>
import {ref, defineComponent} from "vue";

export default defineComponent({
  name: "EventAlert",
  setup() {
    const toasts = ref([])

    const createToast = (payload) => {
      toasts.value.push({
        content: payload.content,
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
.toast-body {
  background-color: rgba(142, 170, 230, 0.98);
  color: #011d2a;
}
.toast-close {
  background-color : #ffffff;
  color: #011d2a;
}

</style>
