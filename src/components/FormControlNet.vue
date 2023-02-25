<script setup lang="ts">
import { ref } from 'vue';
import { ElForm, ElButton, ElCollapseItem, ElCollapse } from 'element-plus';
import FormSlider from '../components/FormSlider.vue';
import FormRadio from '../components/FormRadio.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormControlSelect from '../components/FormControlSelect.vue';
import FormSelect from '../components/FormSelect.vue';
import FormInput from '../components/FormInput.vue';
import FormSeed from '../components/FormSeed.vue';
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

const negativePromptLibrary = ref(false);

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
                        
                        <form-control-select />

                        <form-slider label="Batch Size"      prop="batchSize"      v-model="store.params.n"                  :min="store.minImages"     :max="store.maxImages" />
                        <form-slider label="Steps"           prop="steps"          v-model="store.params.steps"              :min="store.minSteps"      :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                        <form-slider label="Guidance"        prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-slider label="Width"           prop="width"          v-model="store.params.width"              :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Height"          prop="height"         v-model="store.params.height"             :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Clip Skip"       prop="clip_skip"      v-model="store.params.clip_skip"          :min="store.minClipSkip"   :max="store.maxClipSkip"   info="How many iterations will be skipped while parsing the CLIP model." />
                        
                        <FormSeed />
                        
                        <form-model-select />

                        <form-select label="Post-processors" prop="postProcessors" v-model="store.params.post_processing"   :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                        
                        <form-radio  label="Karras"          prop="karras"         v-model="store.params.karras"              :options="['Enabled', 'Disabled']"       info="Improves image generation while requiring fewer steps. Mostly magic!" />
                        <form-radio  label="NSFW"            prop="nsfw"           v-model="store.nsfw"             :options="['Enabled', 'Disabled', 'Censored']" />
                        <form-radio  label="Worker Type"     prop="trusted"        v-model="store.trustedOnly"      :options="['All Workers', 'Trusted Only']" />
                    </el-collapse-item>
                </el-collapse>
            </div>
            <FormImagePreview />
        </el-form>
</template>