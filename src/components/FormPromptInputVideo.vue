<script setup lang="ts">
import { useVideoGeneratorStore } from '@/stores/VideoGenerator';
import { useGeneratorStore } from '@/stores/generator';
import FormInput from '../components/FormInput.vue';
import {
    FolderChecked,
    FolderOpened,
    Plus,
    Clock,
    TrendCharts,
    Delete,
} from '@element-plus/icons-vue';
import { ElButton, ElTooltip } from 'element-plus';
import { ref } from 'vue';
import DialogList from './DialogList.vue';
const vStore = useVideoGeneratorStore();
const store = useGeneratorStore();

const negativePromptLibrary = ref(false);

</script>

<template>


    <div v-for="(prompt, index) in vStore.params.prompts">
        <form-input :prop="`prompt${index+1}`" :spanWidth=2 v-model="vStore.params.prompts[index]" :autosize="{ minRows: 2 }" resize="vertical" type="textarea" placeholder="Enter prompt here" label-position="top" label-style="justify-content: space-between; width: 100%;">
            <template #label>
                <div>Prompt  {{index+1}}</div>
            </template>
            <template #inline>
                <el-tooltip content="Add Seed" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.prompts?.push('');
                    }" :icon="Plus"/>
                </el-tooltip>
                <el-tooltip content="Prompt History" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => promptLibrary = true" :icon="Clock "/>
                </el-tooltip>
                <el-tooltip content="Prompt Styles" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: 2px; width: 95%;" @click="() => selectStyle = true" :icon="TrendCharts"/>
                </el-tooltip>
                <el-tooltip content="Remove Seed" placement="right" v-if="index > 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.prompts.splice(index, 1);
                    }" :icon="Delete"/>
                </el-tooltip>
            </template>
        </form-input>
    </div>

    <form-input
        label="Negative Prompt"
        prop="negativePrompt"
        v-model="vStore.params.neg_prompts"
        autosize
        resize="vertical"
        type="textarea"
        placeholder="Enter negative prompt here"
        info="What to exclude from the image. Not working? Try increasing the guidance."
        label-position="top"
        :spanWidth=2
    >
        <template #inline>
            <el-tooltip content="Add Negative Prompt" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => store.pushToNegativeLibrary(store.negativePrompt)" :icon="FolderChecked"/>
            </el-tooltip>
            <el-tooltip content="Negative Prompts" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: 2px; width: 95%;" @click="() =>  negativePromptLibrary = true" :icon="FolderOpened"/>
            </el-tooltip>
        </template>
    </form-input>
    <DialogList
        v-model="negativePromptLibrary"
        title="Negative Prompts"
        :list="store.negativePromptLibrary"
        empty-description="No negative prompts found"
        search-empty-description="Found no matching negative prompt(s) from your search."
        search-text="Search by prompt"
        deleteText="Delete preset"
        useText="Use preset"
        @use="negPrompt => vStore.params.neg_prompts = negPrompt"
        @delete="store.removeFromNegativeLibrary"
    />
</template>