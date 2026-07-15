<template>

    <v-snackbar
        v-model="showError"
        color="error"
        timeout="6000"
        location="top"
    >
        {{ errorMessage }}

        <template v-slot:actions>
            <v-btn variant="text" @click="showError = false">
                Close
            </v-btn>
        </template>
    </v-snackbar>

    <v-sheet class="pa-8 mx-auto my-8" rounded="lg" elevation="2" max-width="1200"> 
        <v-container>
            <v-row>
                <v-col>
                    <h1 class="header-color">Fayetteville, AR Dispatch Logs</h1>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <v-alert closable variant="tonal" color="primary" type="info">
                        <p>This site provides a more useful interface for viewing the city of Fayetteville's dispatch log data. The existing site data can be found here: <a target="_blank" href="https://www.fayetteville-ar.gov/1333/Police-and-Fire-Dispatch-Logs">https://www.fayetteville-ar.gov/1333/Police-and-Fire-Dispatch-Logs</a>. Three days worth of dispatch data can be pulled back at a time. </p>
                    </v-alert>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <search-bar @search="search"></search-bar>
                </v-col>
            </v-row>
            <v-row>
                <v-col class="d-flex">
                    <v-chip v-if="incidents && incidents.length > 0" class="ml-auto" size="large" color="primary"><i>{{ incidents?.length }} incidents returned</i></v-chip>
                </v-col>
            </v-row>
            <v-row class="mb-3">
                <v-col class="d-flex justify-space-around">
                    <v-tabs color="accent" v-model="tabs" :disabled="store.loading">
                        <v-tab value="map">Map</v-tab>
                        <v-tab value="table">Data Table</v-tab>
                        <v-tab value="stats">Statistics</v-tab>
                    </v-tabs>
                </v-col>
            </v-row>

            <v-row class="ma-5">
                <v-col>
                    <data-filter :call-types="uniqueCallTypes" @update:filters="onFiltersChanged"></data-filter>
                </v-col>
            </v-row>

            <v-tabs-window v-model="tabs">
                <v-tabs-window-item value="map">
                    <v-sheet height="1000">
                        <v-row>
                            <v-col>
                                <incidents-map :incidents="incidents" :filters="filters"></incidents-map>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-tabs-window-item>
                <v-tabs-window-item value="table">
                    <v-sheet>
                        <v-row>
                            <v-col>
                                <incidents-table :incidents="incidents" :filters="filters"></incidents-table>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-tabs-window-item>
                <v-tabs-window-item value="stats">
                    <v-sheet height="1000">
                        <v-row>
                            <v-col>
                                <incident-stats :incidents="incidents" :filters="filters"></incident-stats>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-container>
    </v-sheet>
</template>

<script setup lang="ts">
import SearchBar from '@/components/SearchBar.vue';
import type { Incident, Filters } from '@/types/dispatchLogs';
import { useStore } from '@/stores/store'; 
import { ref, computed } from 'vue';
import IncidentsTable from '@/components/IncidentsTable.vue';
import IncidentsMap from '@/components/IncidentsMap.vue';
import IncidentStats from '@/components/IncidentStats.vue';
import DataFilter from '@/components/DataFilter.vue';

const store = useStore();

const closeInfo = ref(false);

const tabs = ref("table")

const incidents = ref<Incident[]>();

const filters = ref<Filters | null>(null);

function onFiltersChanged(updatedFilters: (Filters | null)) {
    filters.value = updatedFilters;
}

const showError = ref(false);
const errorMessage = ref('');

async function search(startDate: string, endDate: string) {
    store.loading = true;
    let url = `/api/incidents/${startDate}/${endDate}`
    try {
        let response = await fetch(url, {
            headers: {
                "X-Dispatch-Client": "mandy_approval"
            }
        });
        if (response.ok) {
            let data = await response.json();
            incidents.value = data;
        } else {
            console.error(response);
            errorMessage.value = `Failed to load incidents (${response.status} ${response.statusText}). Please try again.`;
            showError.value = true;
        }
    } catch (err) {
        console.error(err);
        errorMessage.value = 'Unable to reach the dispatch log server. Check your connection and try again.';
        showError.value = true;
    } finally {
        store.loading = false;
    }
}

const uniqueCallTypes = computed(() => {
    const callTypes = incidents.value?.map(e => e.callType);
    return [... new Set(callTypes)]
})

</script>

<style scoped>

a {
    color: #CC5500 ;
}

.header-color {
    color: #CC5500;
}

</style>
