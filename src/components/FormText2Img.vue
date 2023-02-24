<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElForm, ElButton, ElTooltip, ElCollapseItem, ElCollapse } from 'element-plus';
import FormSlider from '../components/FormSlider.vue';
import FormSeed from '../components/FormSeed.vue';
import FormRadio from '../components/FormRadio.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormSelect from '../components/FormSelect.vue';
import FormInput from '../components/FormInput.vue';
import FormPromptInput from '../components/FormPromptInput.vue';
import FormImagePreview from '../components/FormImagePreview.vue';
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { useOptionsStore } from '@/stores/options';
import { useCanvasStore } from '@/stores/canvas';

const store = useGeneratorStore();
const uiStore = useUIStore();
const optionsStore = useOptionsStore();
const canvasStore = useCanvasStore();

const samplerListLite = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a"]
const dpmSamplers = ['k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a', 'k_dpmpp_sde']

const negativePromptLibrary = ref(false);

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
                        <form-input
                            label="Negative Prompt"
                            prop="negativePrompt"
                            v-model="store.negativePrompt"
                            autosize
                            resize="vertical"
                            type="textarea"
                            placeholder="Enter negative prompt here"
                            info="What to exclude from the image. Not working? Try increasing the guidance."
                            label-position="top"
                        >
                            <template #inline>
                                <el-button class="small-btn" style="margin-top: 2px" @click="store.pushToNegativeLibrary(store.negativePrompt)" text>Save preset</el-button>
                                <el-button class="small-btn" style="margin-top: 2px" @click="() => negativePromptLibrary = true" text>Load preset</el-button>
                            </template>
                        </form-input>
                        <form-seed />
                        <form-select label="Sampler"            prop="sampler"        v-model="store.params.sampler_name"       :options="availableSamplers"   info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast."/>
                        <form-slider label="Batch Size"         prop="batchSize"      v-model="store.params.n"                  :min="store.minImages"     :max="store.maxImages" />
                        <form-slider label="Steps"              prop="steps"          v-model="store.params.steps"              :min="store.minSteps"      :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                        <form-slider label="Width"              prop="width"          v-model="store.params.width"              :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Height"             prop="height"         v-model="store.params.height"             :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Guidance"           prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-slider label="Clip Skip"          prop="clip_skip"      v-model="store.params.clip_skip"          :min="store.minClipSkip"   :max="store.maxClipSkip"   info="How many iterations will be skipped while parsing the CLIP model." />
                        <form-model-select />
                        <form-radio  label="Multi-model select" prop="multiModel"     v-model="store.multiModelSelect"          :options="['Enabled', 'Disabled']" />
                        <form-select label="Post-processors"    prop="postProcessors" v-model="store.postProcessors"            :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                        <form-radio  label="Tiling"             prop="tiling"         v-model="store.params.tiling"             :options="['Enabled', 'Disabled']"       info="Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/" />
                        <form-radio  label="Karras"             prop="karras"         v-model="store.params.karras"             :options="['Enabled', 'Disabled']"       info="Improves image generation while requiring fewer steps. Mostly magic!" />
                        <form-radio  label="Hires Fix"          prop="hires_fix"      v-model="store.params.hires_fix"          :options="['Enabled', 'Disabled']"       :disabled="store.params.width > 512 && store.params.height > 512 ? false : true"   info="Improves image generation, generation im multiples passe with lower resolution at start!" />
                        <form-radio  label="NSFW"               prop="nsfw"           v-model="store.nsfw"                      :options="['Enabled', 'Disabled', 'Censored']" />
                        <form-radio  label="Worker Type"        prop="trusted"        v-model="store.trustedOnly"               :options="['All Workers', 'Trusted Only']" />
                    </el-collapse-item>
                </el-collapse>
            </div>
            <FormImagePreview />
        </el-form>
</template>