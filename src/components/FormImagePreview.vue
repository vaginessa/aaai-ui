<script setup lang="ts">
import CustomCanvas from '../components/CustomCanvas.vue';
import ImageProgress from '../components/ImageProgress.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue';
import { useUIStore } from '@/stores/ui';
import { useGeneratorStore } from '@/stores/generator';
import { useOptionsStore } from '@/stores/options';
import { useUserStore } from "@/stores/user";
import { ElButton, ElCard, ElRow, ElCol } from 'element-plus';
import FormPun from '../components/FormPuns.vue';
const uiStore = useUIStore();
const store = useGeneratorStore();
const optionsStore = useOptionsStore();
const userStore = useUserStore();
window.addEventListener('keyup', (event) => {
    if(event.ctrlKey && event.key == "Enter") {
        store.generateImage(store.generatorType)
    }
});
</script>

<template>
    <div class="main">
        <el-row style="width:100%" :gutter="10" justify="end">
            <el-col :span="3" :xs="24">
                <el-button style="width:100%" @click="store.resetStore()">Reset</el-button>
            </el-col>
            <el-col :span="15" :xs="24">
                <el-button
                    type="primary"
                    :disabled="store.generating"
                    style="width:100%"
                    @click=" store.generateImage(store.generatorType)"
                >
                    Generate 
                    (<span>
                        <span v-if="userStore.apiKey !== '0000000000' && userStore.apiKey !== ''">
                            {{ optionsStore.allowLargerParams === 'Enabled' ? store.canGenerate ? '✅ ' : '❌ ' : '' }}
                            {{ store.kudosCost.toFixed(2) }} kudos{{ store.canGenerate ? '' : ' required' }}
                            for
                        </span>
                        {{ store.totalImageCount }} image{{ store.totalImageCount === 1 ? "" : "s" }}
                    </span>)
                </el-button>
            </el-col>
            <el-col :span="6" :xs="24">
                <el-button
                    :type="store.generating ? 'danger' : 'info'"
                    :plain="!store.generating"
                    :disabled="store.cancelled || !store.generating"
                    style="width:100%"
                    @click="store.cancelled = true"
                > Cancel
                </el-button>
            </el-col>
        </el-row>
    </div>
    <div class="image center-horizontal">
        <el-card class="center-both generated-image" >
            <div v-if="!store.generating && store.images.length == 0">
                <CustomCanvas v-if="store.generatorType === 'Img2Img'" />
                <FormPun v-else />
            </div>
            <image-progress v-if="!uiStore.showGeneratedImages" />
            <generated-carousel v-if="uiStore.showGeneratedImages && store.images.length !== 0" />
        </el-card> 
    </div>
</template>