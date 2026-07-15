import { defineStore } from 'pinia'
import { ref } from 'vue';

export const useStore = defineStore('store', () => {
  
    const loading = ref<boolean>(false);

    const snackbar = ref<boolean>(false);
    const snackbarMessage = ref<string>("");
    const snackbarColor = ref<string>("");

    function showSnackbar(message: string, color: string) {
      snackbar.value = true;
      snackbarMessage.value = message;
      snackbarColor.value = color;
    }

  return { loading, snackbar, snackbarColor, snackbarMessage, showSnackbar }
})