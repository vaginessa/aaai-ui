<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas';
import { onMounted, ref } from 'vue';
import { ElUpload, ElIcon, ElButton, ElForm, ElColorPicker, type UploadFile, type UploadRawFile, ElInput, ElRow, ElCol, ElMessage } from 'element-plus';
import { UploadFilled, Select, Download, EditPen, RefreshLeft, Delete  } from '@element-plus/icons-vue';
import { useGeneratorStore } from '@/stores/generator';
import EraserIcon from './icons/EraserIcon.vue';
import FormSlider from './FormSlider.vue';
import { useUIStore } from '@/stores/ui';
import { convertToBase64 } from '@/utils/base64';
import { encode } from "image-js";
import { loadURL as base64Image, toBase64URL } from "../utils/base64"
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();

const upload = ref();

async function handleChange(uploadFile: UploadFile) {
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        uiStore.raiseError(lang.GetText(`errorneedstobeanimage`), false);
        upload.value!.clearFiles();
        return;
    }
    const base64File = await convertToBase64(uploadFile.raw as UploadRawFile) as string;
    store.currentImageProps.sourceImage = base64File;
    canvasStore.isDrawing = false;
    canvasStore.addImageObjectToCanvas(base64File);
}

function removeImage() {
    store.currentImageProps.sourceImage = "";
}

onMounted(() => {
    canvasStore.createNewCanvas("canvas");
})

const WebURL = ref("");

async function isValidUrl(urlString: string) {
    var inputElement = document.createElement('input');
    inputElement.type = 'url';
    inputElement.value = urlString;
    if (!inputElement.checkValidity()) {
        return false;
    } else {
        const res = await fetch(urlString);
        const buff = await res.blob();
        return buff.type.startsWith('image/');
    }   
} 

function getWebImage() {
    try {
        isValidUrl(WebURL.value).then(validUrl => {
            if(!validUrl) 
                throw new Error(lang.GetText(`errorinvalidurl`));
                base64Image(WebURL.value || "").then(imgData => {
                    Promise.resolve(toBase64URL(encode(imgData), "image/webp")).then(data => {
                    store.currentImageProps.sourceImage = data;
                    canvasStore.isDrawing = false;
                    canvasStore.addImageObjectToCanvas(data);
                });
            });
        });
    } catch(e) {
        console.log(e);
        ElMessage({
            message: `"${lang.GetText('errorcouldnotretrieveimage')}" "${(WebURL.value || "")}" ...`,
            type: 'error',
        });
        WebURL.value = "";
    }
}

</script>
<template>
    <el-upload
        drag
        ref="upload"
        :auto-upload="false"
        @change="handleChange"
        :limit="1"
        multiple
        v-if="!store.currentImageProps.sourceImage"
    >
        <el-icon :size="100"><upload-filled /></el-icon>
        <div>Drop file here OR <em>click to upload</em></div>
        <template #tip>
            <div v-if="store.generatorType === 'Img2Img'">
                <el-row style="margin-top: 15px;">
                    <el-col :span="22">
                        <el-input v-model="WebURL" :placeholder="lang.GetText(`placeholderweblink`)" clearable />
                    </el-col>
                    <el-col :span="2">
                        <el-button @click="getWebImage()" :icon="Download" plain />
                    </el-col>
                </el-row>
            </div>
        </template>
    </el-upload>
    <div v-show="store.currentImageProps.sourceImage">
        <div class="canvas-container">
            <canvas id="canvas"></canvas>

            <div v-if="canvasStore.imageStage === 'Scaling'" class="action-buttons">
                <el-button @click="canvasStore.AcceptImage()" :icon="Select" plain/>
                <el-button @click="canvasStore.RemoveImage()" :icon="Delete" plain/>
            </div>

            <div v-if="canvasStore.imageStage === 'Painting'" class="action-buttons">
                <el-button @click="canvasStore.downloadMask()" :icon="Download" plain />
                <el-button @click="canvasStore.flipErase()"    :icon="canvasStore.erasing ? EditPen : EraserIcon" plain />
                <el-color-picker v-model="canvasStore.drawColor" show-alpha v-if="canvasStore.isDrawing" />
            </div>

            <div v-if="canvasStore.imageStage === 'PaintingMask'" class="action-buttons">
                <el-button @click="canvasStore.BackToScaling()" :icon="RefreshLeft" plain/>
                <el-button @click="canvasStore.downloadMask()" :icon="Download" plain />
                <el-button @click="canvasStore.flipErase()"    :icon="canvasStore.erasing ? EditPen : EraserIcon" plain />
            </div>

            <el-form v-if="canvasStore.imageStage === 'Scaling'" label-width="110px" style="margin-top: 10px">
                <form-slider style="margin-bottom: 5px" :label="lang.GetText(`llscaling`)" prop="brushSize" v-model="canvasStore.canvasImageScaleFactor" :min="0.05" :max="1" :step="0.05" :change="canvasStore.setScale"/>
            </el-form>
            <el-form v-if="canvasStore.imageStage === 'Painting' || canvasStore.imageStage === 'PaintingMask'" label-width="110px" style="margin-top: 10px">
                <form-slider style="margin-bottom: 5px" :label="lang.GetText(`llbrushsize`)" prop="brushSize" v-model="canvasStore.brushSize" :min="10" :max="100" :step="10" :change="canvasStore.setBrush" />
            </el-form>

        </div>
    </div>
</template>

<style scoped>
.action-buttons {
    display: flex;
    flex-direction: column;
    position: absolute;
    gap: 10px;
    top: 10px;
    right: 10px;
}

.action-buttons > * {
    width: 30px;
    height: 30px;
    margin: 0;
}

.canvas-container {
    position: relative;
}

@media only screen and (max-width: 1280px) {
    .canvas-container {
        transform: scale(0.7);
    }
}
</style>