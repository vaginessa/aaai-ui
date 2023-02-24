<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';
import FormInput from '../components/FormInput.vue';
import { MagicStick } from '@element-plus/icons-vue';
import { ElButton, ElTooltip } from 'element-plus';
const store = useGeneratorStore();
</script>

<template>
    <form-input label="Seed" prop="seed" v-model="store.params.seed" placeholder="Enter seed here">
        <template #append>
            <el-tooltip content="Randomize!" placement="top">
                <el-button :icon="MagicStick" @click="() => { 
                    MersenneTwister(undefined);
                    store.params.seed = genrand_int32().toString()
                }" />
            </el-tooltip>
        </template>
    </form-input>
</template>