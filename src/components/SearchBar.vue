<template>
    <v-form ref="searchBar" v-model="isValid">
        <v-row>
            <v-col cols="12" sm="4">
                <v-text-field @update:model-value="triggerFormValidation" validate-on="eager" :rules="[rules.dateDifference, rules.validDate, rules.startBeforeEnd, rules.notInFuture]" type="date" v-model="startDate" label="Start Date"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
                <v-text-field @update:model-value="triggerFormValidation" validate-on="eager" :rules="[rules.dateDifference, rules.validDate, rules.endAfterStart, rules.notInFuture]" type="date" v-model="endDate" label="End Date"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4" class="d-flex">
                <v-btn :disabled="store.loading || !isValid" @click="search()" class="ml-auto" color="primary">
                    Search
                    <v-progress-circular v-show="store.loading" class="ml-2" size="small" indeterminate></v-progress-circular>
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>


<script setup lang="ts">

import { ref, computed } from 'vue';
import moment from 'moment';
import { useStore } from '@/stores/store';
import type { VForm } from 'vuetify/components'

const emit = defineEmits([
    "search"
])
const store = useStore();

const searchBar = ref<VForm | null>(null);
const isValid = ref<boolean>(false);

const rules = {
    dateDifference: (value: string) => dateDifference.value <= 2 || "Maximum of 3 days of history can be returned.",
    startBeforeEnd: (value: string) => 
        !endDate.value || moment(value).isSameOrBefore(moment(endDate.value)) || "Start date must be before or equal to end date.",
    endAfterStart: (value: string) => 
        !startDate.value || moment(value).isSameOrAfter(moment(startDate.value)) || "End date must be after or equal to start date.",
    validDate: (value: string) => 
        moment(value, moment.ISO_8601, true).isValid() || "Please enter a valid date.",
    notInFuture: (value: string) =>
        moment(value).isSameOrBefore(moment(), 'day') || "Date cannot be in the future.",
}

const dateDifference = computed(() => {
    return Math.abs(moment(startDate.value).diff(moment(endDate.value), 'days'));
});

const triggerFormValidation = () => {
  if (searchBar.value) {
    searchBar.value.validate()
  }
}

const startDate = ref<string>(moment().format("YYYY-MM-DD"));
const endDate = ref<string>(moment().format("YYYY-MM-DD"));

function search() {
    emit("search", startDate.value, endDate.value);
}

</script>