<template>
    <v-expansion-panels v-if="callTypes && callTypes.length > 0">
        <v-expansion-panel>
            <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                    Data Filters
                    <v-spacer></v-spacer>
                    <v-chip v-if="hasActiveFilters" color="warning" prepend-icon="mdi-alert">
                        Filters Applied
                    </v-chip>
                </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
                <div>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-combobox
                            :disabled="store.loading"
                            variant="underlined"
                            class="ml-1"
                            label="Call Types"
                            :items="props.callTypes"
                            v-model="filters.callTypes"
                            multiple
                            chips
                            >
                            </v-combobox>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field
                            :disabled="store.loading"
                            clearable
                            @click:clear="filters.filter = ''"
                            color="accent"
                            variant="underlined"
                            label="Filter data on all fields"
                            v-model="filters.filter"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </div>
                <div class="d-flex justify-end">
                    <v-btn
                        variant="text"
                        color="accent"
                        :disabled="!hasActiveFilters || store.loading"
                        @click="resetFilters"
                    >
                        Reset
                    </v-btn>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { Filters } from '@/types/dispatchLogs'
import { useStore } from '@/stores/store';

const store = useStore();

const props = defineProps<{
    callTypes?: string[]
}>();

const emit = defineEmits<{
    (e: 'update:filters', value: Filters | null): void
}>()

const filters = ref<Filters>({
    filter: '',
    callTypes: []
})

function combine(date: string, time: string): string {
    if (!date) return ''
    return time ? `${date}T${time}` : `${date}T00:00`
}

const hasActiveFilters = computed(() => {
    return (
        !!filters.value.filter ||
        filters.value.callTypes.length > 0
    )
})

function resetFilters() {
    filters.value.filter = ''
    filters.value.callTypes = []
}

watch(
    filters,
    (value) => {
        emit('update:filters', hasActiveFilters.value ? { ...value } : null)
    },
    { deep: true }
)
</script>