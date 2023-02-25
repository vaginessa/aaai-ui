<script setup lang="ts">
import {
    ElImage,
    ElCarousel,
    ElCarouselItem,
    ElTooltip,
    ElButton,
} from 'element-plus';
import FormSelect from './FormSelect.vue';
import InfoTooltip from './InfoTooltip.vue';
import { useGeneratorStore } from '@/stores/generator';
import { Plus, Minus } from '@element-plus/icons-vue';
const store = useGeneratorStore();
</script>

<template>
    <form-select
        label="Models"
        prop="models"
        v-model="store.selectedModelMultiple"
        :options="store.filteredAvailableModelsGrouped"
        filterable
        multiple
        placement="top" 
        v-if="store.multiModelSelect === 'Enabled'"
        class="multi-model-select" :grouping="true"
    >
        <template #inline>
            <el-tooltip content="Deactivate Multi Mode" placement="top">
                <el-button :icon="Minus" @click="() => { 
                    store.multiModelSelect = 'Disabled';
                }" />
            </el-tooltip>
        </template>
    </form-select>
    <form-select label="Model" prop="model" :grouping="true" v-model="store.selectedModel" :options="store.filteredAvailableModelsGrouped" filterable v-else>
        <template #label>
            <div style="display: flex; align-items: center; width: 100%">
                <div style="margin-right: 5px">Model</div>
                <InfoTooltip>
                    <div>Model Description: {{store.modelDescription}}</div>
                    <el-carousel
                        v-if="store.selectedModelData?.showcases"
                        style="margin-top: 10px"
                        :autoplay="false"
                        indicator-position="none"
                        :arrow="store.selectedModelData.showcases.length === 1 ? 'never' : 'always'"
                        height="220px"
                    >
                        <el-carousel-item v-for="showcase in store.selectedModelData.showcases" :key="showcase">
                            <el-image :src="showcase" />
                        </el-carousel-item>
                    </el-carousel>
                </InfoTooltip>
            </div>
        </template>
        <template #inline>
            <el-tooltip content="Activate Multi Mode" placement="top">
                <el-button :icon="Plus" @click="() => { 
                    store.multiModelSelect = 'Enabled';
                }" />
            </el-tooltip>
        </template>
    </form-select>
</template>

<style>
.multi-model-select > .el-form-item__content > .el-select {
    min-width: 80%
}
</style>