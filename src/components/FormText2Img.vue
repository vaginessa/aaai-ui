<script setup lang="ts">
import { computed } from 'vue';
import { ElForm, ElCollapseItem, ElCollapse } from 'element-plus';
import FormSlider from '../components/FormSlider.vue';
import FormSeed from '../components/FormSeed.vue';
import FormRadio from '../components/FormRadio.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormSelect from '../components/FormSelect.vue';
import FormOnOffButton from '../components/FormOnOffButton.vue';
import FormPromptInput from '../components/FormPromptInput.vue';
import FormImagePreview from '../components/FormImagePreview.vue';
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { useOptionsStore } from '@/stores/options';
import { useCanvasStore } from '@/stores/canvas';
import { Check, Close } from '@element-plus/icons-vue';

const store = useGeneratorStore();
const uiStore = useUIStore();
const optionsStore = useOptionsStore();
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
                <el-collapse v-model="uiStore.activeCollapse">
                    <el-collapse-item title="Generation Options" name="2">
                        <form-prompt-input />
                        <form-seed />
                        <form-select label="Sampler"            prop="sampler"        v-model="store.params.sampler_name"       :options="availableSamplers"   info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast."/>
                        <form-slider label="Batch Size"         prop="batchSize"      v-model="store.params.n"                  :min="store.minImages"     :max="store.maxImages" />
                        <form-slider label="Steps"              prop="steps"          v-model="store.params.steps"              :min="store.minSteps"      :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                        <form-slider label="Width"              prop="width"          v-model="store.params.width"              :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Height"             prop="height"         v-model="store.params.height"             :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Guidance"           prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-slider label="Clip Skip"          prop="clip_skip"      v-model="store.params.clip_skip"          :min="store.minClipSkip"   :max="store.maxClipSkip"   info="How many iterations will be skipped while parsing the CLIP model." />
                        <form-model-select />
                        <form-select label="Post-processors"    prop="postProcessors" v-model="store.params.post_processing"            :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                        
                        <form-on-off-button prop="tiling" label="Tiling" :icon-on="Check" :icon-off="Close" v-model="store.params.tiling" info="Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/" />
                        <form-on-off-button prop="karras" label="Karras" :icon-on="Check" :icon-off="Close" v-model="store.params.karras" info="Improves image generation while requiring fewer steps. Mostly magic!" />
                        <form-on-off-button prop="hirex_fix" label="Hires Fix" :icon-on="Check" :icon-off="Close" v-model="store.params.hires_fix" info="Improves image generation, generation im multiples passe with lower resolution at start!" :disabled="(store.params.width || 0) > 512 && (store.params.height || 0) > 512 ? false : true" disabled_info="You need to have an image that is at least 576x576!" />
                        
                        <form-radio  label="NSFW"               prop="nsfw"           v-model="store.nsfw"                      :options="['Enabled', 'Disabled', 'Censored']" />
                        <form-radio  label="Worker Type"        prop="trusted"        v-model="store.trustedOnly"               :options="['All Workers', 'Trusted Only']" />
                    </el-collapse-item>
                </el-collapse>
            </div>
            <FormImagePreview />
        </el-form>
</template>