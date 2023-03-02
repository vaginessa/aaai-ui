<script setup lang="ts">
import { ref } from 'vue';
import CustomCanvas from '../components/CustomCanvas.vue';
import ImageProgress from '../components/ImageProgress.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue';
import { useUIStore } from '@/stores/ui';
import { useGeneratorStore } from '@/stores/generator';
import { useOptionsStore } from '@/stores/options';
import { ElButton, ElCard, vLoading } from 'element-plus';
import { dots } from "@/constants";
const uiStore = useUIStore();
const store = useGeneratorStore();
const optionsStore = useOptionsStore();
</script>

<template>
    <div class="main">
        <el-button @click="store.resetStore()">Reset</el-button>
        <el-button
            type="primary"
            :disabled="store.generating"
            style="width: 60%;"
            @click="store.generateImage(store.generatorType)"
        >
            Generate 
            (<span>
                <span v-if="optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== ''">
                    {{ optionsStore.allowLargerParams === 'Enabled' ? store.canGenerate ? '✅ ' : '❌ ' : '' }}
                    {{ store.kudosCost.toFixed(2) }} kudos{{ store.canGenerate ? '' : ' required' }}
                    for
                </span>
                {{ store.totalImageCount }} image{{ store.totalImageCount === 1 ? "" : "s" }}
            </span>)
        </el-button>
        <el-button
            :type="store.generating ? 'danger' : 'info'"
            :plain="!store.generating"
            style="width: 20%"
            :disabled="store.cancelled || !store.generating"
            @click="store.cancelled = true"
        > Cancel
        </el-button>
    </div>
    <div class="image center-horizontal">
        <el-card class="center-both generated-image" >
            <div v-if="!store.generating && store.images.length == 0">
                <CustomCanvas v-if="/Inpainting/.test(store.generatorType)" />
                <CustomCanvas v-if="/Img2Img/.test(store.generatorType)" />
                <CustomCanvas v-if="/ControlNet/.test(store.generatorType)" />
            </div>
            <image-progress v-if="!uiStore.showGeneratedImages" />
            <generated-carousel v-if="uiStore.showGeneratedImages && store.images.length !== 0" />
        </el-card> 
    </div>
</template>