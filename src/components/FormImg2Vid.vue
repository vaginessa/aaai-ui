<script setup lang="ts">

import { useVideoGeneratorStore } from '@/stores/VideoGenerator';
import { useLanguageStore } from '@/stores/i18n';
import { ElForm, ElMessage, ElButton, ElCard, ElProgress, ElRow, ElCol, ElUpload, type UploadFile, type UploadRawFile, ElInput } from 'element-plus';
import { UploadFilled, Download  } from '@element-plus/icons-vue';
import FormPun from './FormPuns.vue';
import BaseLink from '@/components/BaseLink.vue';
import { convertToBase64 } from '@/utils/base64';
import { ref } from 'vue';
import { loadURL as base64Image, toBase64URL } from "../utils/base64";
import { encode } from "image-js";
import FormOnOffButton from './FormOnOffButton.vue';
import { Check, Close } from '@element-plus/icons-vue';
import FormSlider from './FormSlider.vue';

const store = useVideoGeneratorStore();
const lang = useLanguageStore();

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
            if(!validUrl) { 
                throw new Error("Invalid URL!");
            } else {
                base64Image(WebURL.value || "").then(imgData => {
                    if (imgData !== undefined) {
                        Promise.resolve(toBase64URL(encode(imgData), "image/webp")).then(data => {
                            store.sourceImage = data;
                        });
                    }
                });
            }
        });
    } catch(e) {
        console.log(e);
        ElMessage({
            message: `Could not retrive image "${(WebURL.value || "")}" ...`,
            type: 'error',
        });
        WebURL.value = "";
    }
}

async function handleChange(uploadFile: UploadFile) {
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        ElMessage({
            message: `Uploaded file needs to be a image! ...`,
            type: 'error',
        });
        return;
    }
    const base64File = await convertToBase64(uploadFile.raw as UploadRawFile) as string;
    store.sourceImage = base64File;
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
                <div style="margin-bottom:8px;">
                    <el-button
                        type="warning"
                        :disabled="store.sourceImage == ''"
                        style="width: 49%;font-size: 0.9em;"
                        @click="store.sourceImage = ''"
                    >
                        Reset Image
                    </el-button>
                    <el-button
                        type="warning"
                        :disabled="store.sourceImage == ''"
                        style="width: 49%;font-size: 0.9em;"
                        @click="store.resetParallaxParams()"
                    >
                        Reset Parameters
                    </el-button>
                </div>
                <el-card class="center-both" style="width: 100%;display: block;" >
                    <el-upload
                        drag
                        ref="upload"
                        :auto-upload="false"
                        @change="handleChange"
                        :limit="1"
                        style="max-width: 500px;margin: auto;"
                        v-if="store.sourceImage == ''"
                    >
                        <el-icon :size="100" style="max-width: 250px;"><upload-filled /></el-icon>
                        <div>Drop file here OR <em>click to upload</em></div>
                        <template #tip>
                            <div>
                                <el-row style="margin-top: 15px;">
                                    <el-col :span="22">
                                        <el-input v-model="WebURL" placeholder="Web Link" clearable />
                                    </el-col>
                                    <el-col :span="2">
                                        <el-button @click="getWebImage()" :icon="Download" plain />
                                    </el-col>
                                </el-row>
                            </div>
                        </template>
                    </el-upload>
                    <div v-else style="display: flex;align-content: center;justify-content: center;">
                        <img :src="store.sourceImage" style="max-width:100%;max-height: 500px;" />
                    </div>
                    <div v-if="store.sourceImage != ''" style="margin-top: 25px;margin-bottom:50px;width: 100%;">
                        <form-on-off-button prop="boomerang" label="Bommerang" :icon-on="Check" :icon-off="Close" v-model="store.parallaxParams.boomerang_clip" :info ="lang.GetText(`ttboomerang`)" />
                        <form-on-off-button prop="autozoom" label="Autozoom" :icon-on="Check" :icon-off="Close" v-model="store.parallaxParams.autozoom" :info ="lang.GetText(`ttautozoom`)" />
                        <form-slider v-if="store.parallaxParams.autozoom == false" label="Start X Offset" prop="startXOffset" v-model="store.parallaxParams.start_x_offset" :min="-1024" :max="1024" />
                        <form-slider v-if="store.parallaxParams.autozoom == false" label="Start Y Offset" prop="startYOffset" v-model="store.parallaxParams.start_y_offset" :min="-1024" :max="1024" />
                        <form-slider v-if="store.parallaxParams.autozoom == false" label="End X Offset" prop="endXOffset" v-model="store.parallaxParams.end_x_offset" :min="-1024" :max="1024" />
                        <form-slider v-if="store.parallaxParams.autozoom == false" label="End Y Offset" prop="endYOffset" v-model="store.parallaxParams.end_y_offset" :min="-1024" :max="1024" />
                        <form-slider label="Zoom amount" prop="zoomAmount" v-model="store.parallaxParams.zoom_amount" :min="1.1" :max="2" :step="0.05" />
                        <form-slider label="Zoom duration" prop="zoomDuration" v-model="store.parallaxParams.zoom_duration" :min="0.2" :max="10" :step="0.05" />
                        <form-slider label="Frame rate" prop="frameRate" v-model="store.parallaxParams.frame_rate" :min="1" :max="100" />
                        <form-on-off-button prop="predict" label="Music generation" :icon-on="Check" :icon-off="Close" v-model="store.parallaxParams.predict_music" />
                    </div>
                </el-card>
            </div>
            <div class="main">
                <el-button
                    type="primary"
                    :disabled="store.generating || store.generateLock || store.sourceImage == ''"
                    style="width: 100%;font-size: 0.9em;"
                    @click="store.generateParallaxClicked()"
                >
                    Generate
                </el-button>
            </div>
            <div class="image center-horizontal">
                <el-card class="center-both generated-video" >
                    <div class="noticeBox" v-if="!store.generating && store.videoUrl === 'none'">
                        <div class="genNotice" v-if="store.generateLock">
                            <strong>ATTENTION</strong>
                            <hr/>
                            Can not accept more generation requests!<br/>
                            {{ store.generateMsg }}<br/>
                            To find out more join our <BaseLink href="https://discord.gg/ugEqPP5wMT">Discord</BaseLink>!
                        </div>
                        <div>
                            <FormPun />    
                        </div>
                    </div>
                    <div v-if="!store.generating && store.videoUrl !== 'none'" class="player">
                        <video controls>
                            <source :src=store.videoUrl type="video/mp4" />
                        </video>
                    </div>                           
                    <div v-if="store.generating" style="text-align: center;">
                        <div style="font-size: 15px; padding: 8px; margin-top: 10px; background-color: var(--el-color-info-light-9); border-radius: 5px">
                            <div style="font-size: 18px">Generation Status</div>
                            <div>{{ store.queueStatus }}</div>
                        </div>
                    </div>
                </el-card> 
            </div>
    </el-form>
</template>

<style scoped>

.image.center-horizontal {
    display: block;
}

.generated-video {
    width: 100%;
}

.player video {
    max-width: 100%;
    max-height: 100%;
}

.noticeBox {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.genNotice {
    color: black;
    padding: 20px;
    border-radius: 5px;
	background: #FFFB00; 
	border: solid #000000 3px; 
	box-shadow: 2px 2px 22px rgba(0, 0, 0, 0.5) inset; 
	-webkit-box-shadow: 2px 2px 22px rgba(0, 0, 0, 0.5) inset; 
	-moz-box-shadow: 2px 2px 22px rgba(0, 0, 0, 0.5) inset; 
}

.genNotice hr {
    border-color: black;
}

</style>