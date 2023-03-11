<script setup lang="ts">

import { useVideoGeneratorStore } from '@/stores/VideoGenerator';
import { ElForm, ElButton, ElCard, ElProgress } from 'element-plus';
import FormPromptInput from '../components/FormPromptInput.vue';
import FormSeed from '../components/FormSeed.vue';
import FormSlider from '../components/FormSlider.vue';
import FormPun from '../components/FormPuns.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import OpenPlayerJS from "openplayerjs";

const store = useVideoGeneratorStore();

function getAspectRatio(isWidth: boolean) {
    let width = (store.params.width || 1);
    let height = (store.params.height || 1);
    let dividend = 0;
    let divisor = 0;
    if(width == height) {
        return "(1:1)";
    } else {
        if(height>width) {
            dividend = height;
            divisor = width;
        }
        if(width>height) {
            dividend = width;
            divisor = height;
        }
        var gcd = -1;
        let remainder = 0;
        while(gcd == -1){
            remainder = dividend % divisor;
            if(remainder == 0) {
                gcd = divisor;
            } else {
                dividend = divisor;
                divisor = remainder;
            }
        }
        var hr = width / gcd;
        var vr = height / gcd;
        if(isWidth)
            return "(" + hr.toFixed(0) + ":" + vr.toFixed(0) + ")";
        else
            return "(" + vr.toFixed(0) + ":" + hr.toFixed(0) + ")";
    }
}
</script>
<template>
    <el-form
            label-position="left"
            label-width="140px"
            :model="store"
            class="container"
            :rules="store.generateFormBaseRules"
            @submit.prevent
        >
            <div class="sidebar">
                <form-prompt-input />  
                <FormSeed /> 
                <form-slider label="Steps" prop="steps" v-model="store.params.steps" :min="store.minSteps" :max="store.maxSteps" info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." /> 
                <form-slider :label="`Width ` + getAspectRatio(true)" prop="width" v-model="store.params.width" :min="store.minWidth" :max="store.maxWidth" :step="64" />
                <form-slider label="Height" prop="height" v-model="store.params.height" :min="store.minHeight" :max="store.maxHeight" :step="64" />
                <form-slider label="Guidance" prop="cfgScale" v-model="store.params.cfg_scale" :min="store.minCfgScale" :max="store.maxCfgScale" :step="0.5" info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                <form-slider label="Desired FPS" prop="desiredFPS" v-model="store.params.fps" :min="store.minFPS" :max="store.maxFPS" />
                <form-slider label="Desired Length" prop="desiredLength" v-model="store.params.desired_duration" :min="store.minDuration" :max="store.maxDuration" />
                <form-model-select />
            </div>
            <div class="main">
                <el-button
                    type="primary"
                    :disabled="store.generating"
                    style="width: 70%;font-size: 0.9em;"
                    @click="store.generateVideo()"
                >
                    Generate
                </el-button>
                <el-button
                    :type="store.generating ? 'danger' : 'info'"
                    :plain="!store.generating"
                    style="width: 30%"
                    :disabled="store.cancelled || !store.generating"
                    @click="store.cancelled = true"
                > Cancel
                </el-button>
            </div>
            <div class="image center-horizontal">
                <el-card class="center-both generated-image" >
                    <div v-if="!store.generating && store.videoUrl === 'none'">
                        <FormPun />    
                    </div>
                    <div v-if="!store.generating && store.videoUrl !== 'none'">
                        show vid
                    </div>                           
                    <div v-if="store.generating" style="text-align: center;">
                        <el-progress
                            type="circle"
                            :percentage="uiStore.progress / (pendingRequests.length + 1)"
                            :width="200"
                        >
                            <template #default>
                                <span>EST: {{ Math.round((store.queueStatus?.wait_time as number) * (pendingRequests.length + 1)) }}s</span><br>
                            </template>
                        </el-progress>
                        <div style="font-size: 15px; padding: 8px; margin-top: 10px; background-color: var(--el-color-info-light-9); border-radius: 5px">
                            <div style="font-size: 18px">Generation Status</div>
                            <span>Pending: {{ (store.queueStatus.waiting || 0) + pendingRequests.map(el => el?.params?.n || 0).reduce((curr, next) => curr + next, 0) }} - </span>
                            <span>Processing: {{ store.queueStatus.processing }} - </span>
                            <span>Finished: {{ store.queueStatus.finished }} - </span>
                            <span>Restarted: {{ store.queueStatus.restarted }}</span>
                            <div>Queue Position: {{ store.queueStatus.queue_position }}</div>
                        </div>
                        <div @click="uiStore.showGeneratedImages = true" v-if="store.images.length != 0" class="view-images">
                            <span>View {{ store.gatheredImages }} / {{ store.queue.map(el => el.params?.n || 0).reduce((curr, next) => curr + next, 0) }} images</span>
                            <el-icon><Right /></el-icon>
                        </div>
                    </div>
                </el-card> 
            </div>
    </el-form>
</template>