<script setup lang="ts">
import FormSelect from './FormSelect.vue';
import { useGeneratorStore } from '@/stores/generator';
import { ElButton, ElTooltip } from 'element-plus';
import { Plus, Minus } from '@element-plus/icons-vue';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useGeneratorStore();
</script>

<template>
    <form-select
        :label="lang.GetText(`llcontroltype`)"
        prop="controlType"
        v-model="store.selectedControlTypeMultiple"
        :options="store.availableControlType"
        filterable
        multiple
        placement="top" 
        v-if="store.multiControlTypeSelect === 'Enabled'"
        class="multi-control-type-select" :grouping="false"
    >
        <template #inline>
            <el-tooltip :content="lang.GetText(`lldeactivatemultimode`)" placement="top">
                <el-button :icon="Minus" @click="() => { 
                    store.multiControlTypeSelect = 'Disabled';
                }" />
            </el-tooltip>
        </template>
    </form-select>
    <form-select :label="lang.GetText(`llcontroltype`)" prop="controlType" :grouping="false" v-model="store.params.control_type" :options="store.availableControlType" filterable v-else>
        <template #label>
            <div style="display: flex; align-items: center; width: 100%">
                <div style="margin-right: 5px">Control Type</div>
            </div>
        </template>
        <template #inline>
            <el-tooltip :content="lang.GetText(`llactivatemultimode`)" placement="top">
                <el-button :icon="Plus" @click="() => { 
                    store.multiControlTypeSelect = 'Enabled';
                }" />
            </el-tooltip>
        </template>
    </form-select>
</template>

<style>
.multi-control-type-select > .el-form-item__content > .el-select {
    min-width: 80%
}
</style>