<template>

    <div class="toolbar-map">
        <div class="ml-auto">
            <v-btn :disabled="store.loading" variant="tonal" color="accent" @click="resetMapView" append-icon="mdi-reload">Reset Zoom</v-btn>
        </div>
    </div>

    <div ref="mapContainer" class="map-container" />

    <v-dialog v-model="dialog" max-width="400">
        <v-card v-if="selectedIncident">
            <v-card-title class="d-flex align-center ga-2">
                {{ selectedIncident.callType }}
            </v-card-title>
            <v-card-subtitle>
                {{ moment(selectedIncident.timestamp).format('MMMM Do YYYY, h:mm:ss a') }}
            </v-card-subtitle>
            <v-divider />
            <v-card-text>
                <v-list density="compact">
                    <v-list-item prepend-icon="mdi-map-marker" title="Address">
                        <template #subtitle>
                            <span v-if="selectedIncident.address.trim() !== '<UNKNOWN>'">
                                {{ selectedIncident.address }}, {{ selectedIncident.city }}
                            </span>
                            <v-chip v-else color="warning" prepend-icon="mdi-alert" size="small">
                                Pending Incident
                            </v-chip>
                        </template>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-city" title="City" :subtitle="selectedIncident.city" />
                    <v-list-item prepend-icon="mdi-crosshairs-gps" title="Coordinates">
                        <template #subtitle>
                            {{ selectedIncident.lat.toFixed(5) }}, {{ selectedIncident.lon.toFixed(5) }}
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn text="Close" @click="dialog = false" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import type { Incident, Filters } from '@/types/dispatchLogs';
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import moment from 'moment';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '@/stores/store';

const FAYETTEVILLE_CENTER: L.LatLngTuple = [36.0619, -94.1574];
const DEFAULT_ZOOM = 12;

const store = useStore();

const props = defineProps<{
    incidents?: Incident[],
    filters?: Filters | null
}>();

const mapContainer = ref<HTMLElement | null>(null);
const dialog = ref(false);
const selectedIncident = ref<Incident | null>(null);

let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;

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

function resetMapView() {
    map?.setView(FAYETTEVILLE_CENTER, DEFAULT_ZOOM);
}

function initMap() {
    if (!mapContainer.value) return;

    map = L.map(mapContainer.value).setView(FAYETTEVILLE_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
    plotMarkers();
}

function plotMarkers() {
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    const incidents = filteredIncidents.value; // ← use filtered list
    if (incidents.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    for (const incident of incidents) {
        if (incident.lat === -361 || incident.lon === -361) continue;

        const marker = L.circleMarker([incident.lat, incident.lon], {
            radius: 8,
            fillColor: '#ef5350',
            color: '#b71c1c',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.8,
        });

        marker.on('click', () => {
            selectedIncident.value = incident;
            dialog.value = true;
        });

        markerLayer.addLayer(marker);
        bounds.push([incident.lat, incident.lon]);
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
}

// Re-plot when incidents data or search term changes
watch([() => props.incidents, filteredIncidents], plotMarkers, { deep: true });

onMounted(() => {
    initMap();
    nextTick(() => map?.invalidateSize());
});

onBeforeUnmount(() => {
    map?.remove();
    map = null;
});
</script>

<style scoped>
.map-container {
    margin-left: 5%;
    width: 90%;
    height: 600px;
}

.toolbar-map {
    margin-left: 5%;
    width: 90%;
    display: flex;
    margin-bottom: 1rem;
}

</style>