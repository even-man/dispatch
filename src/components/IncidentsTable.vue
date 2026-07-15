<template>
    <v-data-table hover density="compact" :headers="headers" :items="incidentsToShow" :items-per-page-options="[10, 25, 50, 100]">
        <template v-slot:item="{item}">
            <tr class="click-item" @click="openMap(item)">
                <td>
                    {{ moment(item.timestamp).format('MM-DD-YYYY HH:mm') }}
                </td>
                <td>
                    <span v-if="item.address.trim() !== '<UNKNOWN>'">{{ item.address }}</span>
                    <span v-else>
                        <v-chip color="warning" prepend-icon="mdi-alert">
                            Pending
                        </v-chip>
                    </span>
                </td>
                <td>
                    {{ item.callType }}
                </td>
            </tr>
        </template>
    </v-data-table>

    <v-dialog max-width="500" v-model="openMapDialog" @afterEnter="initMap" @afterLeave="destroyMap">
        <v-card v-if="clickedItem?.address.trim() !== '<UNKNOWN>' &&
                      clickedItem?.lat !== -361 &&
                      clickedItem?.lon !== -361">
            <v-card-title>
                {{ clickedItem?.address }}
            </v-card-title>
            <v-card-subtitle>
                {{ clickedItem?.callType }}
            </v-card-subtitle>
            <v-card-text>
                <div ref="mapContainer" class="map-container"></div>
            </v-card-text>
        </v-card>
        <v-card v-else>
            <v-card-text>No map data avaliable for incident</v-card-text>
        </v-card>
    </v-dialog>


</template>

<script setup lang="ts">
import type { Incident, Filters } from '@/types/dispatchLogs';
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import moment from 'moment';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const props = defineProps<{
    incidents?: Incident[],
    filters: Filters | null
}>();

const headers = ref([
    { title: 'Timestamp', key: 'timestamp', sort: (a: string, b: string) => moment(a).valueOf() - moment(b).valueOf() },
    { title: 'Address', key: 'address', align: 'start' as const },
    { title: 'Call Type', key: 'callType', align: 'start' as const },
])

const incidentsToShow = computed(() => {
    if (props.filters) {
        return filteredIncidents.value;
    } else {
        return props.incidents;
    }
})

const filteredIncidents = computed(() => {
    const incidents = props.incidents ?? [];
    const filters = props.filters;
    if (!filters) return incidents;

    const term = filters.filter.trim().toLowerCase();
    const callTypes = filters.callTypes ?? [];

    return incidents.filter(incident => {
        const matchesTerm = !term || [incident.callType, incident.address, incident.city]
            .some(field => field?.toLowerCase().includes(term));

        const matchesCallType = callTypes.length === 0 || callTypes.includes(incident.callType);

        return matchesTerm && matchesCallType;
    });
});

const clickedItem = ref<Incident | null>(null);
const openMapDialog = ref<boolean>(false);
const mapContainer = ref<HTMLElement | null>(null);

let mapInstance: L.Map | null = null;

function openMap(item: Incident) {
    clickedItem.value = item;
    openMapDialog.value = true;
}

function hasValidLocation(item: Incident | null): boolean {
    return !!item &&
        item.address.trim() !== '<UNKNOWN>' &&
        item.lat !== -361 &&
        item.lon !== -361;
}

function destroyMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
}

async function initMap() {
    if (!hasValidLocation(clickedItem.value) || !mapContainer.value) return;

    destroyMap();

    await nextTick();

    const lat = clickedItem.value!.lat;
    const lon = clickedItem.value!.lon;

    mapInstance = L.map(mapContainer.value).setView([lat, lon], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(mapInstance);

    L.marker([lat, lon]).addTo(mapInstance)
        .bindPopup(clickedItem.value!.address)
        .openPopup();
}

onBeforeUnmount(() => {
    destroyMap();
});

</script>

<style scoped>

.click-item:hover {
    cursor: pointer;
}

.map-container {
    height: 300px;
    width: 100%;
    border-radius: 4px;
}

</style>