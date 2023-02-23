<script setup lang="ts">
import {
    ElImage,
    ElCarousel,
    ElCarouselItem,
} from 'element-plus';
import FormSelect from './FormSelect.vue';
import InfoTooltip from './InfoTooltip.vue';
import { useOptionsStore } from '@/stores/options';
import { useWorkerStore } from '@/stores/workers';
const store = useOptionsStore();
const workerStore = useWorkerStore();

workerStore.updateWorkers();

</script>

<template>
    <form-select
        label="Use Specific Worker"
        prop="useWorker"
        v-model="store.useWorkers"
        :options="[...workerStore.sortedByNameWorkers.map(el => {return {label: el.name, value: el.id}})]"
        filterable
        multiple
        placement="top"
        class="multi-model-select"
    >
    </form-select>
</template>

<style>
.multi-model-select > .el-form-item__content > .el-select {
    min-width: 80%
}
</style>