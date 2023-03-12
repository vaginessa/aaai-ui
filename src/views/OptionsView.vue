<script setup lang="ts">
import {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    type UploadFile,
    ElIcon,
    ElUpload,
    ElTabs,
    ElTabPane
} from 'element-plus';
import {
    UploadFilled,
    Download
} from '@element-plus/icons-vue';
import { useOptionsStore } from '@/stores/options';
import { useUserStore } from '@/stores/user';
import type { BasicColorSchema } from '@vueuse/core';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import { ref } from 'vue';
import { useOutputStore, type ImageData } from '@/stores/outputs';
import { downloadMultipleWebp } from '@/utils/download';
import { db } from '@/utils/db';
import FormWorkerSelect from '../components/FormWorkerSelect.vue';

const store = useOptionsStore();
const outputsStore = useOutputStore();
const userStore = useUserStore();

interface ColorModeOption {
    value: BasicColorSchema;
    label: string;
}

const options: ColorModeOption[] = [
    {
        value: 'dark',
        label: 'Dark',
    }, {
        value: 'light',
        label: 'Light',
    }/*, {
        value: 'contrast',
        label: 'Contrast',
    }, {
        value: 'cafe',
        label: 'Zelda',
    }*/, {
        value: 'auto',
        label: 'Auto',
    }
]

const PictureTypes = ["WEBP", "PNG", "JPG"];

const fileList = ref([]);
const upload = ref();

async function handleChange(uploadFile: UploadFile) {
    outputsStore.importFromZip(uploadFile);
    upload.value!.clearFiles();
}

async function bulkDownload() {
    const selectedOutputs = await db.outputs.toArray();
    downloadMultipleWebp((selectedOutputs.filter(el => el != undefined) as ImageData[]))
}
</script>

<template>
    <h1>Options</h1>
    <el-form
        label-position="top"
        :model="store.options"
        @submit.prevent
    >
        <el-tabs type="border-card" style="min-height: 50vh;">
            <el-tab-pane label="🖨️ Generation">
                <h2>Generation Options</h2>
                <el-form-item label="API Key" prop="apiKey">
                    <el-input
                        v-model="userStore.apiKey"
                        type="password"
                        placeholder="Enter API Key Here"
                        autocomplete="off"
                        class="apikey"
                        show-password
                    />
                    <el-button class="anon" @click="userStore.setAnon()">Anon?</el-button>
                    <div v-if="userStore.userId !== '0'"><small style="color: var(--el-text-color-regular);">User ID: <strong>{{userStore.userId}}</strong></small></div>
                </el-form-item>
                <form-radio label="Larger Values" prop="allowLargerParams" v-model="store.allowLargerParams" :options="['Enabled', 'Disabled']" info="Allows use of larger step values and dimension sizes if you have the kudos on hand." :disabled="userStore.apiKey === '0000000000' || userStore.apiKey === ''" />
                
                <form-radio label="Worker List Mode" prop="workerListMode" v-model="store.workerListMode" :options="['Whitelist', 'Blacklist']" info="When whitelist mode is selected, only the workers listed below will be able to take your jobs. When blacklist is selected, all workers, except the ones on the list will be eligible to take your jobs. When the field is empty, all workers are eligible, regardless of what mode is selected. Make sure the model you selected is served by at least one eligible worker or no generation will be possible, and you will be stuck on pending." />
                <form-worker-select />

                <form-radio  label="Share Generated Images with LAION" prop="shareWithLaion" v-model="store.shareWithLaion" :options="['Enabled', 'Disabled']" info="Automatically and anonymously share images with LAION (the non-profit that created the dataset that was used to train Stable Diffusion) for use in aesthetic training in order to improve future models. See the announcement at https://discord.com/channels/781145214752129095/1020707945694101564/1061980573096226826 for more information. NOTE: This option is automatically enabled for users without a valid API key. " :disabled="userStore.apiKey === '0000000000' || userStore.apiKey === ''" />
            </el-tab-pane>
            <el-tab-pane label="📷 Images">
                <h2>Image Options</h2>
                <form-slider label="Images Per Page" prop="pageSize" v-model="store.pageSize" :min="10" :max="50" :step="5" :disabled="store.pageless === 'Enabled'" />
                <form-radio  label="Pageless Format" prop="pageless" v-model="store.pageless" :options="['Enabled', 'Disabled']" />
                <form-radio  label="Carousel Auto Cycle" prop="autoCarousel" v-model="store.autoCarousel" :options="['Enabled', 'Disabled']" />
                <form-select label="Download Fileformat" prop="downloadFileFormat" v-model="store.pictureDownloadType" :options="PictureTypes" />
                <form-radio  label="Download Meta Data" prop="zipMetaData" v-model="store.zipMetaData" :options="['Enabled', 'Disabled']" info="Downloads or Zips a JSON file with generation settings to every images." />
                <el-form-item label="Export Images (ZIP File)">
                    <el-button :icon="Download" @click="bulkDownload()">Download {{outputsStore.outputsLength}} image(s)</el-button>
                </el-form-item>
                <el-form-item label="Import Images (ZIP File)">
                    <el-upload
                        drag
                        ref="upload"
                        :auto-upload="false"
                        @change="handleChange"
                        :file-list="fileList"
                        :limit="1"
                        multiple
                    >
                        <el-icon :size="100"><upload-filled /></el-icon>
                        <div>Drop file here OR <em>click to upload</em></div>
                    </el-upload>
                </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="⚙️ General">
                <h2>General Options</h2>
                <form-select label="Color Scheme" prop="colorScheme" v-model="store.options.colorMode" :options="options" />
                <form-radio  label="Allow anonymous data collection" prop="pageless" v-model="store.pageless" :options="['Enabled', 'Disabled']" info="What Data could you possible collect? Easy, we collect only a generate button press and the type of request (txt2img, img2img ...). It is totally anonymously and is only to display the usage statistics in the dashboard."/>
            </el-tab-pane>
        </el-tabs>
    </el-form>
</template>  

<style scoped>
.anon {
    width: 80px
}

.el-tab-pane {
    max-width: 600px;
}

h2 {
    margin-top: 0
}

.apikey {
    width: calc(100% - 80px)
}

@media only screen and (max-width: 1000px) {
    .anon {
        width: 80px
    }

    .apikey {
        width: 100%
    }
}
</style>