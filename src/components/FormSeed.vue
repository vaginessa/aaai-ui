<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';
import FormInput from '../components/FormInput.vue';
import { MagicStick, Delete } from '@element-plus/icons-vue';
import { ElButton, ElTooltip, ElDivider } from 'element-plus';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useGeneratorStore();
</script>

<template>
    <form-input :label="lang.GetText(`llseed`)" prop="seed" v-model="store.params.seed" :placeholder="lang.GetText(`placeholderseed`)">
        <template #append>
            <el-tooltip :content="lang.GetText(`llrandomize`)" placement="top">
                <el-button :icon="MagicStick" @click="() => { 
                    MersenneTwister(undefined);
                    store.params.seed = genrand_int32().toString()
                }" />
            </el-tooltip><el-divider direction="vertical" border-style="dashed" />
            <el-tooltip :content="lang.GetText(`lldelete`)" placement="top">
                <el-button :icon="Delete"     @click="() => {
                    store.params.seed = '';
                }" />
            </el-tooltip>
        </template>
    </form-input>
</template>