<script setup lang="ts">
import {
    ElButton,
    ElTooltip,
    ElSelect,
    ElOption,
    ElSwitch,
} from 'element-plus';
import {
    Plus,
    Delete,
    Check,
} from '@element-plus/icons-vue';
import { useGeneratorStore } from '@/stores/generator';
import FormInput from './FormInput.vue';
import DialogList from './DialogList.vue';
import Star12Filled from './icons/Star12Filled.vue';
import Star12Regular from './icons/Star12Regular.vue';
import { computed, ref } from 'vue';
import { useUIStore } from '@/stores/ui';
import { formatDate } from '@/utils/format';
const store = useGeneratorStore();
const uiStore = useUIStore();
const promptLibrary = ref(false);
const selectStyle = ref(false);

function getStyle(key: string) {
    const style = store.styles[key as any];
    const [prompt, negativePrompt] = style.prompt.split("###");
    return {
        prompt,
        promptSplit: prompt.replace("{np}", "").split("{p}"),
        negativePrompt,
        negativePromptSplit: negativePrompt ? negativePrompt.split("{np}") : undefined,
        model: style.model,
    }
}

function getPromptFromHistory(prompt: string) {
    return store.promptHistory.find(el => el.prompt === prompt);
}

function handleUseStyle(style: string) {
    const { prompt, negativePrompt, model } = getStyle(style);
    store.prompt = prompt.replace("{p}", store.prompt).replace("{np}", "");
    if (negativePrompt) store.negativePrompt = negativePrompt.replace("{np}", store.negativePrompt);
    if (store.filteredAvailableModelsGrouped.map(el => el?.options.map(el2 => el2.value)).find(el => el?.includes(model))) {
        store.selectedModel = model;
    } else {
        uiStore.raiseWarning("Warning: style's model isn't available.", false)
    }
}

function handleFavourite(prompt: string) {
    const promptHistoryPrompt = store.promptHistory.findIndex(el => el.prompt === prompt);
    if (promptHistoryPrompt === -1) return;
    store.promptHistory[promptHistoryPrompt].starred = !store.promptHistory[promptHistoryPrompt].starred;
}

const sortedPromptHistory = computed(
    () => store.promptHistory
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .sort((a, b) => Number(b.starred) - Number(a.starred))
        .map(el => el.prompt || el)
)

const searchStyle = ref("");
const showDetails = ref(false);
const nsfwBong = ref(false);
const showNsfwBong = computed(() => nsfwBong.value);

const nsfwREGEX = new RegExp('girl|\\bboy\\b|student|\\byoung\\b|lit[tl]le|\\blil\\b|small|tiny')
function showNsfwNotification(event) {
  if (nsfwREGEX.test(event.toLowerCase())) {
    console.log("bong - ", event);

    nsfwBong.value = true;
  } else {
    console.log("no bong - ", event);
    nsfwBong.value = false;
  }
}
</script>

<template>
    <div id="warning" v-if="store.selectedModelData.nsfw && showNsfwBong">
        
        
        <svg height="50" viewBox="0 0 512 512" width="50" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M449.07,399.08,278.64,82.58c-12.08-22.44-44.26-22.44-56.35,0L51.87,399.08A32,32,0,0,0,80,446.25H420.89A32,32,0,0,0,449.07,399.08Zm-198.6-1.83a20,20,0,1,1,20-20A20,20,0,0,1,250.47,397.25ZM272.19,196.1l-5.74,122a16,16,0,0,1-32,0l-5.74-121.95v0a21.73,21.73,0,0,1,21.5-22.69h.21a21.74,21.74,0,0,1,21.73,22.7Z"/></svg>


        <div class="wtext">
            <strong>Warning</strong>you are about to generate a prompt that will be filtered by the hord network. Please revise your prompt or choose a non NSFW Model.
        </div>

        <div class="clear">&nbsp;</div>
    </div>
    <form-input :change="showNsfwNotification" prop="prompt" v-model="store.prompt" :autosize="{ minRows: 2 }" resize="vertical" type="textarea" placeholder="Enter prompt here" label-position="top" label-style="justify-content: space-between; width: 100%;">
        <template #label>
            <div>Prompt</div>
            <el-tooltip content="Add trigger (dreambooth)" placement="top" v-if="store.selectedModelData?.trigger">
                <el-button v-if="store.selectedModelData.trigger.length === 1" @click="() => store.addDreamboothTrigger()" :icon="Plus" class="trigger-select" />
                <el-select v-else class="trigger-select" @change="store.addDreamboothTrigger">
                    <el-option
                        v-for="item in store.selectedModelData?.trigger"
                        :key="item"
                        :label="item"
                        :value="item"
                    />
                </el-select>
            </el-tooltip>
        </template>
        <template #inline>
            <el-button class="small-btn" style="margin-top: 2px" @click="() => promptLibrary = true" text>Load history</el-button>
            <el-button class="small-btn" style="margin-top: 2px" @click="() => selectStyle = true"   text>Load style</el-button>
        </template>
    </form-input>
    <DialogList
        v-model="promptLibrary"
        :list="sortedPromptHistory"
        title="Prompt History"
        empty-description="No prompt history found - try generating an image!"
        search-text="Search by prompt"
        search-empty-description="Found no matching prompt(s) from your search."
        @use="prompt => store.prompt = prompt"
        @delete="store.removeFromPromptHistory"
    >
        <template #actions="{item, handleUse, handleDelete}">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap-reverse; align-items: center; width: 100%">
                <div style="color: var(--el-color-info); font-size: 12px">{{formatDate(getPromptFromHistory(item)?.timestamp || 0)}}</div> 
                <div>
                    <el-button class="small-btn" @click="() => handleUse(item)" :icon="Check">Apply</el-button>
                    <el-button
                        class="small-btn"
                        @click="() => handleFavourite(item)"
                        :icon="getPromptFromHistory(item)?.starred ? Star12Filled : Star12Regular"
                    ></el-button>
                    <el-button class="small-btn" type="danger" @click="() => handleDelete(item)" :icon="Delete">Delete</el-button>
                </div>
            </div>
        </template>
    </DialogList>
    <DialogList
        v-if="selectStyle"
        v-model="selectStyle"
        :list="Object.keys(store.styles).filter(el => el !== 'raw' && el.includes(searchStyle))"
        title="Prompt Styles"
        empty-description="No styles found"
        search-empty-description="Found no matching style(s) from your search."
        searchText="Search by style"
        useText="Use Style"
        @use="handleUseStyle"
        width="50%"
    >
        <template #options>
            <div>
                <span style="margin-right: 10px">Show Details</span>
                <el-switch v-model="showDetails" />
            </div>
        </template>
        <template #item="itemProps">
            <div style="display: flex; justify-content: space-between">
                <h3>{{itemProps.item}}</h3>
                <strong>{{store.styles[itemProps.item].model}}</strong>
            </div>
            <div v-if="showDetails">
                <h4>Your prompt after applying:</h4>
                <div>
                    <span>{{getStyle(itemProps.item).promptSplit[0]}}</span>
                    <span style="color: var(--el-color-primary)">{{store.prompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item).promptSplit[1]}}</span>
                </div>
                <div v-if="getStyle(itemProps.item).negativePromptSplit || getStyle(itemProps.item).prompt.includes('{np}')">
                    <h4>Negative Prompt: </h4>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[0] || ""}}</span>
                    <span style="color: var(--el-color-primary)">{{store.negativePrompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[1] || ""}}</span>
                </div>
            </div>
        </template>
    </DialogList>
</template>

<style scoped>
h3 {
    margin: 0;
}

#warning {
    background: #cfcf0f;
    color: black;
    font-weight: bold;
    padding-top: 10px;
    border-radius: 10px;
    margin: 20px;
}

#warning svg {
    float: left;
    width: 15%;
    height: 100%;
    padding-right: 3%;
    padding-left: 2%;
}

#warning .wtext {
    float: left;
    width: 80%;
}

#warning strong {
    margin-bottom: 5px;
    display: block;
    font-size: 20px;
}

#warning .clear:after {
  content: "";
  display: table;
  clear: both;
}

h4, h5 {
    margin-bottom: 0;
}

.trigger-select {
    width: 30px;
    height: 30px;
}

.trigger-select .el-input__wrapper {
    padding: 0;
}

.trigger-select .el-select__caret {
    margin: 0;
}

.trigger-select .el-input__suffix, .trigger-select .el-input__suffix-inner {
    width: 100%
}
</style>