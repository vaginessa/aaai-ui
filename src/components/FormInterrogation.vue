<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    type FormRules,
    ElButton,
    ElUpload,
    ElIcon,
    ElCheckbox,
    ElCheckboxGroup,
    ElImage,
    type UploadFile,
    type UploadRawFile,
} from 'element-plus';
import {
    UploadFilled,
    Refresh,
} from '@element-plus/icons-vue';
import { useUIStore } from '@/stores/ui';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import handleUrlParams from "@/router/handleUrlParams";
import { useInterrogationStore } from '@/stores/interrogation';
import { convertToBase64 } from '@/utils/base64';
import InterrogationView from '@/components/InterrogationView.vue';
import { useEllipsis } from '@/utils/useEllipsis';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');
const store = useGeneratorStore();
const uiStore = useUIStore();
const interrogationStore = useInterrogationStore();
const samplerListLite = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a"]
const dpmSamplers = ['k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a', 'k_dpmpp_sde']
function updateCurrentSampler(newSamplers: string[]) {
    if (!store.params) return newSamplers;
    if (!store.params.sampler_name) return newSamplers;
    if (newSamplers.indexOf(store.params.sampler_name) === -1) {
        store.params.sampler_name = newSamplers[0] as any;
    }
    return newSamplers;
}
const availableSamplers = computed(() => {
    if (store.selectedModel === "stable_diffusion_2.0") return updateCurrentSampler(["dpmsolver"])
    if (store.generatorType === 'Txt2Img') return updateCurrentSampler([...samplerListLite, ...dpmSamplers]);
    return updateCurrentSampler(samplerListLite);
})
function disableBadge() {
    if (!store.validGeneratorTypes.includes(store.generatorType)) uiStore.showGeneratorBadge = false;
}

const rules = reactive<FormRules>({
    prompt: [{
        required: true,
        message: 'Please input prompt',
        trigger: 'change'
    }],
    apiKey: [{
        required: true,
        message: 'Please input API Key',
        trigger: 'change'
    }]
});
const negativePromptLibrary = ref(false);
const dots = ref("...");
const ellipsis = setInterval(() => dots.value = dots.value.length >= 3 ? "" : ".".repeat(dots.value.length+1), 1000);
onUnmounted(() => {
    clearInterval(ellipsis);
})
disableBadge();
handleUrlParams();
const upload = ref();
async function handleChange(uploadFile: UploadFile) {
    upload.value!.clearFiles();
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        uiStore.raiseError("Uploaded file needs to be a image!", false);
        return;
    }
    const base64File = await convertToBase64(uploadFile.raw as UploadRawFile) as string;
    interrogationStore.currentInterrogation.source_image = base64File;
    interrogationStore.interrogateImage();
}
function getFormStatus(form: string) {
    return (interrogationStore.currentInterrogation?.status?.forms || []).filter(el => el.form === form)[0];
}
</script>

<template>
        <div v-if="store.generatorType === 'Interrogation'" style="padding-bottom: 50px;">
            <h1 style="margin: 0">Interrogation</h1>
            <div>Interrogate images to get their predicted descriptions, tags, and NSFW status.</div>
            <el-checkbox-group
                v-model="interrogationStore.selectedForms"
                style="display: inline-flex; flex-direction: column;"
            >
                <el-checkbox v-for="form in interrogationStore.possibleForms" :key="form" :label="form">
                    {{ form }}
                    <span style="color: var(--el-color-danger)">{{ form === "interrogation" ? " (warning: may not fulfill)" : "" }}</span>
                </el-checkbox>
            </el-checkbox-group>
            <div v-if="!interrogationStore.currentInterrogation.source_image" style="margin-top: 16px">
                <strong v-if="interrogationStore.selectedForms.length === 0" style="color: var(--el-color-danger)">Choose an interrogation option to proceed!</strong>
                <div :style="interrogationStore.selectedForms.length === 0 ? {
                    pointerEvents: 'none',
                    opacity: 0.5,
                } : ''">
                    <el-upload
                        drag
                        ref="upload"
                        :auto-upload="false"
                        @change="handleChange"
                        :limit="1"
                        multiple
                        style="max-width: 720px"
                        :disabled="interrogationStore.selectedForms.length === 0"
                    >
                        <el-icon :size="100"><upload-filled /></el-icon>
                        <div>Drop file here OR <em>click to upload</em></div>
                    </el-upload>
                </div>
            </div>
            <div v-else-if="!interrogationStore.currentInterrogation.status" style="margin-top: 16px">
                <strong>Uploading image{{dots}}</strong>
            </div>
            <div v-else>
                <div style="margin-top: 8px">
                    <el-button
                        :icon="Refresh"
                        @click="() => {
                            interrogationStore.currentInterrogation = {};
                            interrogationStore.interrogating = false;
                        }"
                    >New Interrogation</el-button>
                </div>
                <h2 style="margin: 16px 0 8px 0">Interrogation Results</h2>
                <el-image
                    :src="interrogationStore.currentInterrogation.source_image"
                    alt="Uploaded Image"
                />
                <div v-if="getFormStatus('nsfw')">
                    <h3 style="margin-bottom: 0">NSFW</h3>
                    <div v-if="getFormStatus('nsfw').state === 'processing'">Processing{{dots}}</div>
                    <div v-else>This image is predicted to be <strong>{{ (getFormStatus('nsfw').result as any).nsfw ? "not safe for work" : "safe for work" }}</strong>.</div>
                </div>
                <div v-if="getFormStatus('caption')">
                    <h3 style="margin-bottom: 0">Caption</h3>
                    <div v-if="getFormStatus('caption').state === 'processing'">Processing{{dots}}</div>
                    <div v-else><strong>{{ (getFormStatus('caption').result as any).caption }}</strong></div>
                </div>
                <div v-if="getFormStatus('interrogation')">
                    <h3 style="margin-bottom: 0">Interrogation</h3>
                    <div
                        v-if="getFormStatus('interrogation').state === 'processing' && (interrogationStore.currentInterrogation.elapsed_seconds || 0) > 300"
                        style="color: var(--el-color-danger)"
                    >
                        <strong>Interrogation is taking longer than expected and may not fulfill.</strong>
                    </div>
                    <div v-if="getFormStatus('interrogation').state === 'processing'">Processing{{dots}}</div>
                    <div v-else>
                        <div v-for="[subject, tags] in (Object.entries(getFormStatus('interrogation').result as any) as any[])" :key="subject">
                            <strong>{{ subject }}</strong>
                            <div v-for="tag in tags" :key="tag.text" style="margin-left: 8px">
                                {{ tag.text }} - <strong>{{ tag.confidence.toFixed(2) }}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
</template>
