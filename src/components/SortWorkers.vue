<script setup lang="ts">
import { useWorkerStore } from '@/stores/workers';
import FormSelect from './FormSelect.vue';
import FormInput from './FormInput.vue';
import ButtonCycle from './ButtonCycle.vue';
import SortDown from './icons/SortDown.vue';
import SortUp from './icons/SortUp.vue';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useWorkerStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    mobile?: boolean;
}>();
</script>

<template>
    <div class="sort-workers">
        <form-input  :label="lang.GetText(`llsearch`)"  prop="search" v-model="store.searchFilter" clearable :style="mobile ? 'margin-bottom: 0' : ''" />
        <form-select :label="lang.GetText(`llsortby`)" prop="sortBy" v-model="store.sortBy" :options="store.sortOptions" />
        <ButtonCycle v-model="store.sortDirection" :options="[{value: lang.GetText(`lldescending`), icon: SortDown}, {value: lang.GetText(`llascending`), icon: SortUp}]" :dimensions="32" />
    </div>
</template>

<style scoped>
    .sort-workers {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
    }
</style>