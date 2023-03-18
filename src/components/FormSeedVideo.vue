<script setup lang="ts">
import { useVideoGeneratorStore } from '@/stores/VideoGenerator';
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';
import FormInput from '../components/FormInput.vue';
import { MagicStick, Delete, Plus } from '@element-plus/icons-vue';
import { ElButton, ElTooltip } from 'element-plus';
const vStore = useVideoGeneratorStore();
</script>

<template>
    <div v-for="(seed, index) in vStore.params.seed">
        <form-input :label="`Seed ${index + 1}`" :spanWidth=2 prop="seed" v-model="vStore.params.seed[index]" placeholder="Enter seed here">
            <template #append>
                <el-tooltip content="Randomize!" placement="top">
                    <el-button :icon="MagicStick" @click="() => { 
                        MersenneTwister(undefined);
                        vStore.params.seed[index] = genrand_int32().toString()
                    }" />
                </el-tooltip>
            </template>
            <template #inline>
                <el-tooltip content="Add Seed" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.seed?.push(0);
                    }" :icon="Plus"/>
                </el-tooltip>
                <el-tooltip content="Remove Seed" placement="right" v-if="index > 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.seed.splice(index, 1);
                    }" :icon="Delete"/>
                </el-tooltip>
            </template>
        </form-input>
    </div>
        <!--form-input label="Seed" :spanWidth=2 prop="seed" v-model="vStore.params.seed" :key="index" placeholder="Enter seed here">
            <template #append>
                <el-tooltip content="Randomize!" placement="top">
                    <el-button :icon="MagicStick" @click="() => { 
                        MersenneTwister(undefined);
                        vStore.latestSeed = genrand_int32().toString()
                    }" />
                </el-tooltip>
            </template>
            <template #inline>
                <el-tooltip content="Add another Seed" placement="right">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => vStore.addNewSeed()" :icon="Plus"/>
                </el-tooltip>
            </template>
        </form-input-->
</template>