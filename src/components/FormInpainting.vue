<script setup lang="ts">
import { computed } from 'vue';
import { ElForm, ElCollapseItem, ElCollapse, ElRow, ElCol } from 'element-plus';
import FormSlider from '../components/FormSlider.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormSelect from '../components/FormSelect.vue';
import FormSeed from '../components/FormSeed.vue';
import FormOnOffButton from '../components/FormOnOffButton.vue';
import FormPromptInput from '../components/FormPromptInput.vue';
import FormImagePreview from '../components/FormImagePreview.vue';
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { useWorkerStore } from '@/stores/workers';
import { useCanvasStore } from '@/stores/canvas';
import { Check, Close } from '@element-plus/icons-vue';

const store = useGeneratorStore();
const uiStore = useUIStore();
const workerStore = useWorkerStore();
const canvasStore = useCanvasStore();

const samplerListLite = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a"]
const dpmSamplers = ['k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a', 'k_dpmpp_sde']

const availableSamplers = computed(() => {
    if (store.selectedModel === "stable_diffusion_2.0") return updateCurrentSampler(["dpmsolver"])
    if (store.generatorType === 'Text2Img') return updateCurrentSampler([...samplerListLite, ...dpmSamplers]);
    return updateCurrentSampler(samplerListLite);
})

function updateCurrentSampler(newSamplers: string[]) {
    if (!store.params) return newSamplers;
    if (!store.params.sampler_name) return newSamplers;
    if (newSamplers.indexOf(store.params.sampler_name) === -1) {
        store.params.sampler_name = newSamplers[0] as any;
    }
    return newSamplers;
}

function onDimensionsChange() {
    canvasStore.showCropPreview = true;
    canvasStore.updateCropPreview();
}

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
                <form-select label="Sampler"            prop="sampler"        v-model="store.params.sampler_name"       :options="availableSamplers"   info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast."/>
                <form-slider label="Batch Size"         prop="batchSize"      v-model="store.params.n"                  :min="store.minImages"     :max="store.maxImages" />
                <form-slider label="Steps"              prop="steps"          v-model="store.params.steps"              :min="store.minSteps"      :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                <form-slider :label="`Width ` + getAspectRatio(true)"              prop="width"          v-model="store.params.width"              :min="store.minWidth"      :max="store.maxWidth" :step="64"   :change="onDimensionsChange" />
                <form-slider label="Height"              prop="height"         v-model="store.params.height"             :min="store.minHeight"     :max="store.maxHeight" :step="64"   :change="onDimensionsChange" />
                <form-slider label="Guidance"           prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                <form-slider label="Clip Skip"          prop="clip_skip"      v-model="store.params.clip_skip"          :min="store.minClipSkip"   :max="store.maxClipSkip"   info="How many iterations will be skipped while parsing the CLIP model." />
                <form-slider label="Init Strength"      prop="denoise"        v-model="store.params.denoising_strength" :min="store.minDenoise"    :max="store.maxDenoise"    :step="0.01" info="The final image will diverge from the starting image at higher values." />
                <form-model-select />
                <form-select label="Post-processors"    prop="postProcessors" v-model="store.params.post_processing"            :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                <el-row>
                    <el-col :span="12" :xs="24">
                        <form-on-off-button prop="karras" label="Karras" :icon-on="Check" :icon-off="Close" v-model="store.params.karras" info="Improves image generation while requiring fewer steps. Mostly magic!" />
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <form-on-off-button prop="trusted_worker" label="Trusted Worker" :icon-on="Check" :icon-off="Close" v-model="store.trustedOnly" info="Only let trusted workers process my request." />
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <form-on-off-button prop="nsfw" label="NSFW" :icon-on="Check" :icon-off="Close" v-model="store.nsfw" info="Allow creation of potential nsfw material." />
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <form-on-off-button prop="nsfw_censored" label="Censored" :icon-on="Check" :icon-off="Close" v-model="store.censor_nsfw" info="If nsfw material is detected should it be censored." :disabled="!store.nsfw" disabled_info="NSFW is disabled!"/>
                    </el-col>
                </el-row>
            </div>
            <FormImagePreview />
        </el-form>
</template>