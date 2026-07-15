<template>
    <v-row class="mx-5">
        <v-col cols="12" sm="6">    
            <div class="d-flex">
                <span><b>Resolved Incidents:</b></span>
                <v-chip class="ml-auto" label color="accent">{{ statistics.resolvedIncidents }}</v-chip>
            </div>
        </v-col>
        <v-col>
            <div class="d-flex">
                <span><b>Pending Incidents:</b></span>
                <v-chip class="ml-auto" label color="accent">{{ statistics.pendingIncidents }}</v-chip>
            </div>
        </v-col>
    </v-row>
    <v-row class="mx-5">
        <v-col>
            <v-card>
                <v-card-text>
                    <div class="text-subtitle-2 mb-2 text-white">Incidents by Type</div>
                    <div style="height: 500px; overflow-y: auto;">
                        <div :style="{ height: countsChartHeight }">
                            <Bar :data="countsChartData" :options="countsChartOptions" />
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
    <v-row class="mx-5">
        <v-col>
            <v-card>
                <v-card-text>
                    <div class="text-subtitle-2 mb-2 text-white">Calls per Hour</div>
                    <div style="height: 250px;">
                        <Line :data="chartData" :options="chartOptions" />
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

</template>

<script setup lang="ts">
import type { Incident, Filters } from '@/types/dispatchLogs';
import { ref, computed } from 'vue';
import moment from 'moment';
import { Line, Bar } from 'vue-chartjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Filler,
    type ChartOptions,
    type ChartData,
    Title
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, Title);

const props = defineProps<{
    incidents?: Incident[],
    filters: Filters | null
}>();

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

const statistics = computed(() => {
    
    let resolvedIncidents = filteredIncidents.value.filter(e => e.city !== null && e.lat !== -361 && e.lon !== -361).length;
    let pendingIncidents = filteredIncidents.value.filter(e => e.city === null || e.lat === -361 || e.lon === -361).length;

    const grouped = Object.groupBy(filteredIncidents.value, (e: Incident) => e.callType);
    const counts = Object.fromEntries(
        Object.entries(grouped).map(([key, value]) => [key, (value ?? []).length])
    );
    
    return {
        resolvedIncidents,
        pendingIncidents,
        counts
    }
})

const hourlyStats = computed(() => {
    const incidents = filteredIncidents.value;

    const buckets = new Map<string, number>();

    for (const incident of incidents) {
        const m = moment(incident.timestamp);
        if (!m.isValid()) continue;

        const key = m.format('YYYY-MM-DD HH');
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const sortedKeys = [...buckets.keys()].sort();
    if (sortedKeys.length === 0) {
        return { counts: [], labels: [] };
    }

    // Fill in every hour between the earliest and latest bucket
    const start = moment(sortedKeys[0], 'YYYY-MM-DD HH');
    const end = moment(sortedKeys[sortedKeys.length - 1], 'YYYY-MM-DD HH');

    const filledKeys: string[] = [];
    const cursor = start.clone();
    while (cursor.isSameOrBefore(end)) {
        filledKeys.push(cursor.format('YYYY-MM-DD HH'));
        cursor.add(1, 'hour');
    }

    const distinctDays = new Set(filledKeys.map(key => key.substring(0, 10)));
    const multiDay = distinctDays.size > 1;

    const counts = filledKeys.map(key => buckets.get(key) ?? 0);
    const labels = filledKeys.map(key => {
        const m = moment(key, 'YYYY-MM-DD HH');
        return multiDay ? m.format('MM/DD HH:00') : m.format('HH:00');
    });

    return { counts, labels };
});

const chartData = computed<ChartData<'line'>>(() => ({
    labels: hourlyStats.value.labels,
    datasets: [
        {
            label: 'Calls',
            data: hourlyStats.value.counts,
            borderColor: '#568203',
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: '#CC5500',
            borderWidth: 2,
        }
    ]
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        title: {
            display: true,
            text: "Calls per hour"
        },
        legend: {
            display: false,
        },
        tooltip: {
            callbacks: {
                title: (items) => items[0]?.label ?? '',
                label: (item) => `${item.formattedValue} calls`,
            }
        }
    },
    scales: {
        x: {
            ticks: {
                color: 'black',
                autoSkip: true,
                maxRotation: 0,
                maxTicksLimit: 12,
            },
            grid: {
                display: false,
            }
        },
        y: {
            beginAtZero: true,
            ticks: {
                color: 'black',
                precision: 0,
            },
            grid: {
                color: 'rgba(215, 222, 224, 0.55)',
            }
        }
    }
}));

const countsChartHeight = computed(() => {
    const rowCount = Object.keys(statistics.value.counts).length;
    // ~22px per bar keeps labels legible; never shrink below the visible viewport
    return `${Math.max(500, rowCount * 22)}px`;
});

const countsChartData = computed<ChartData<'bar'>>(() => {
    const entries = Object.entries(statistics.value.counts).sort((a, b) => b[1] - a[1]);

    return {
        labels: entries.map(([key]) => key),
        datasets: [
            {
                label: 'Incidents',
                data: entries.map(([, value]) => value),
                backgroundColor: '#568203',
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            }
        ]
    };
});

const countsChartOptions = computed<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: (item) => `${item.formattedValue} incidents`,
            }
        }
    },
    scales: {
        x: {
            beginAtZero: true,
            ticks: {
                color: 'black',
                precision: 0,
            },
            grid: {
                color: 'rgba(215, 222, 224, 0.55)',
            }
        },
        y: {
            ticks: {
                color: 'black',
                autoSkip: false,
            },
            grid: {
                display: false,
            }
        }
    }
}));

</script>

<style scoped></style>