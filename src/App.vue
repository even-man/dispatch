<template>
  <v-app>
    <v-main style="background-color: #f2ede4;">
      <HomeView></HomeView>
      <AppFooter></AppFooter>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue';
import AppFooter from './components/AppFooter.vue';
</script>



