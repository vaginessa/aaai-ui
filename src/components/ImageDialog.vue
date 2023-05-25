<script setup lang="ts">
import {
    ElDialog,
} from 'element-plus';
import { SwipeDirection, useSwipe } from '@vueuse/core';
import ImageActions from '../components/ImageActions.vue';
import { computed, ref, watch } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useOutputStore } from '@/stores/outputs';
import { db } from '@/utils/db';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useOutputStore();
const uiStore = useUIStore();

const target = ref();
useSwipe(target, {
    onSwipeEnd(e: TouchEvent, direction: SwipeDirection) {
        if (direction === "RIGHT") uiStore.openModalToLeft()
        if (direction === "LEFT") uiStore.openModalToRight()
    },
});

const modalOpen = computed({
    get() {
        return uiStore.activeModal !== -1;
    },
    set() {
        uiStore.activeModal = -1;
    }
});

const currentOutput = ref(store.currentOutputs[0]);

watch(
    () => uiStore.activeModal,
    async () => {
        const output = store.currentOutputs.find(el => el.id === uiStore.activeModal);
        if (output) return currentOutput.value = output;
        currentOutput.value = await db.outputs.get(uiStore.activeModal) || store.currentOutputs[0];
    }
)

function handleClose() {
    modalOpen.value = false;
}
</script>

<template>
    <el-dialog
        :model-value="modalOpen"
        :width="currentOutput?.width"
        class="image-viewer"
        @closed="handleClose"
        align-center
    >
        <div class="main-output-container" ref="target">
            <!-- Loads the image instantly -->
            <div class="main-output" :style="{
                backgroundImage: `url(${currentOutput.image})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
            }" />
        </div>
        <div style="font-size: 18px; font-weight: 500;">{{currentOutput.prompt?.split("###")[0] || 'Unkown Creation'}}</div>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; letter-spacing: 0.025em;">
            <div>{{lang.GetText(`datanegativeprompt`)}} {{currentOutput.prompt?.split("###")[1] || "None"}}</div>
            <span>{{lang.GetText(`datamodel`)}} {{currentOutput.modelName || "Unknown"}} - </span>
            <span>{{lang.GetText(`datasampler`)}} {{currentOutput.sampler_name || "Unknown"}} - </span>
            <span>{{lang.GetText(`dataseed`)}} {{currentOutput.seed || "Unknown"}} - </span>
            <span>{{lang.GetText(`datasteps`)}} {{currentOutput.steps || "Unknown"}} - </span>
            <span>{{lang.GetText(`datacfg`)}} {{currentOutput.cfg_scale || "Unknown"}}</span>
            <br/>
            <span v-if="currentOutput.denoising_strength">{{lang.GetText(`datadenoise`)}} {{currentOutput.denoising_strength || "None"}} - </span>
            <span>{{lang.GetText(`dataclipskip`)}} {{currentOutput.clip_skip || "Unknown"}} - </span>
            <span>{{lang.GetText(`datadimensions`)}} {{currentOutput.width || "???"}}x{{currentOutput.height || "???"}} - </span>
            <span>{{lang.GetText(`datakarras`)}} {{currentOutput.karras || false}} - </span>
            <span>{{lang.GetText(`datatiling`)}} {{currentOutput.tiling || false}} - </span>
            <span>{{lang.GetText(`datahiresfix`)}} {{currentOutput.hires_fix || false}} - </span>
            <span v-if="currentOutput.control_net">{{lang.GetText(`datacontrolnet`)}} {{currentOutput.control_net || "None"}}</span>
            <div v-if="currentOutput.post_processing?.length">{{lang.GetText(`datapostprocessors`)}} {{(currentOutput.post_processing || []).join(", ") || "None"}}</div>
            <div>{{lang.GetText(`datageneratedin`)}} {{ currentOutput.generation_time?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2}) }} Sec. By: {{currentOutput.workerName || "Unknown"}} <em>{{currentOutput.workerID ? `(${currentOutput.workerID})` : ''}}</em></div>
        </div>
        <div>
            <ImageActions :image-data="currentOutput" />
        </div>
    </el-dialog>
</template>

<style>
.main-output-container {
    display: flex;
    justify-content: center;
    background-color: var(--el-fill-color-light);
}

.main-output {
    width: 100%;
    height: 512px;
    max-height: 100%;
}

.image-viewer {
    width: 100%;
    max-width: 1024px;
    height: 72vh;
    display: flex;
    flex-direction: column;
}

.image-viewer > .el-dialog__header {
    padding: 26px;
}

.image-viewer > .el-dialog__body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
    text-align: center;
    word-break: keep-all;
    overflow-y: scroll;
    padding-top: 0;
    height: 100%;
}

@media only screen and (max-width: 1280px) {
    .image-viewer {
        width: 720px;
    }
}

@media only screen and (max-width: 768px) {
    .image-viewer {
        width: 100%;
        height: 80vh;
    }

    .main-output {
        width: 100%;
        height: 40vh;
    }
}
</style>
