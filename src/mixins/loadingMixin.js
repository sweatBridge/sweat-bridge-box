import { ref } from 'vue';

export const loadingMixin = {
  setup() {
    const isLoading = ref(false);

    const withLoading = async (context, action) => {
      if (context.isLoading.value) return;
      context.isLoading.value = true;
      try {
        await action();
      } finally {
        context.isLoading.value = false;
      }
    };

    return {
      isLoading,
      withLoading
    };
  }
};
