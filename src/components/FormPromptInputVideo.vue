<script setup lang="ts">
    import { useVideoGeneratorStore } from '@/stores/VideoGenerator';
    import { useGeneratorStore } from '@/stores/generator';
    import { useTagsStore } from '@/stores/tags';
    import FormInput from '../components/FormInput.vue';
    import {
        FolderChecked,
        FolderOpened,
        Plus,
        Clock,
        TrendCharts,
        Delete,
        Check,
        MagicStick,
    } from '@element-plus/icons-vue';
    import { ElButton, ElTooltip } from 'element-plus';
    import { computed, ref } from 'vue';
    import DialogList from './DialogList.vue';
    import { formatDate } from '@/utils/format';
    import Star12Filled from './icons/Star12Filled.vue';
    import Star12Regular from './icons/Star12Regular.vue';
    import { onKeyStroke } from '@vueuse/core';
    import { useLanguageStore } from '@/stores/i18n';
    const lang = useLanguageStore();
    const vStore = useVideoGeneratorStore();
    const store = useGeneratorStore();
    const tagStore = useTagsStore();

    const negativePromptLibrary = ref(false);
    const selectStyle = ref(false);
    const promptLibrary = ref(false);
    const showDetails = ref(false);
    const searchStyle = ref("");

    const sortedPromptHistory = computed(
        () => store.promptHistory
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .sort((a, b) => Number(b.starred) - Number(a.starred))
            .map(el => el.prompt || el)
    )

    function getPromptFromHistory(prompt: string) {
        return store.promptHistory.find(el => el.prompt === prompt);
    }

    function handleFavourite(prompt: string) {
        const promptHistoryPrompt = store.promptHistory.findIndex(el => el.prompt === prompt);
        if (promptHistoryPrompt === -1) return;
        store.promptHistory[promptHistoryPrompt].starred = !store.promptHistory[promptHistoryPrompt].starred;
    }

    function handleUseStyle(style: string) {
        const { prompt, negativePrompt, model } = getStyle(style);
        vStore.params.prompts[0] = prompt.replace("{p}", vStore.params.prompts[0]).replace("{np}", "");
        if (negativePrompt) vStore.params.neg_prompts = negativePrompt.replace("{np}", vStore.params.neg_prompts || "");
    }

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

    const currentSegment = computed<string>(() => {
        if (selectedInput.value > 0 && selectedInput.value != undefined && vStore.params.prompts != undefined && vStore.params.prompts[selectedInput.value] != undefined)  {
            const promptParts = vStore.params.prompts[selectedInput.value].split(' ');
            const lastSeg = promptParts[promptParts.length - 1];
            if(lastSeg.includes(',')) {
                const lastSegParts = lastSeg.split(',');
                return lastSegParts[lastSegParts.length - 1];
            }
            return lastSeg;
        }
        return "";
    });

    const selectedInput = ref(0);

    function selectInput(promptId: number) {
        selectedInput.value = promptId;
        //console.log(selectedInput.value);
    }

    function deselectInput(promptId: number) {
        if(promptId == selectedInput.value)
            selectedInput.value = 0;
        //console.log(selectedInput.value);
    }

    onKeyStroke("ArrowDown", (e) => {
        
    });
    onKeyStroke("ArrowUp", (e) => {
        
    });
    onKeyStroke("Enter", (e) => {
        
    });
    onKeyStroke("Tab", (e) => {
        
    });
    onKeyStroke("Space", (e) => {
    });

</script>

<template>


    <div v-for="(prompt, index) in vStore.params.prompts">
        <form-input 
            :prop="`prompt${index+1}`" 
            :spanWidth=2 
            v-model="vStore.params.prompts[index]" 
            :autosize="{ minRows: 2 }" 
            resize="vertical" 
            type="textarea" 
            :placeholder="lang.GetText(`promptplaceholder`)" 
            label-position="top" 
            label-style="justify-content: space-between; width: 100%;"
            @focus="selectInput(index+1)"
            @blur="deselectInput(index+1)"
            v-if="index == 0 || (index > 0 && vStore.params.model != 'Kandinsky')"
        >
            <template #label>
                <div>{{lang.GetText(`llprompt`)}} {{index+1}}</div>
            </template>
            <template #inline>
                <el-tooltip :content="lang.GetText(`lladdprompt`)" placement="right" v-if="index == 0 && vStore.params.model != 'Kandinsky'">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.prompts?.push('');
                    }" :icon="Plus"/>
                </el-tooltip>
                <el-tooltip :content="lang.GetText(`llgenerateprompt`)" placement="right">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.generatePrompt(index);
                    }" :disabled="vStore.generateLock" :icon="MagicStick"/>
                </el-tooltip>
                <el-tooltip :content="lang.GetText(`llprompthistory`)" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => promptLibrary = true" :icon="Clock "/>
                </el-tooltip>
                <el-tooltip :content="lang.GetText(`llpromptstyles`)" placement="right" v-if="index == 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: 2px; width: 95%;" @click="() => selectStyle = true" :icon="TrendCharts"/>
                </el-tooltip>
                <el-tooltip :content="lang.GetText(`llremoveprompt`)" placement="right" v-if="index > 0">
                    <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => {
                        vStore.params.prompts.splice(index, 1);
                    }" :icon="Delete"/>
                </el-tooltip>
            </template>
        </form-input>
    </div>
    <DialogList
        v-model="promptLibrary"
        :list="sortedPromptHistory"
        :title="lang.GetText(`llprompthistory`)"
        :empty-description="lang.GetText(`descnoprompthistory`)"
        :search-text="lang.GetText(`llsearchbyprompt`)"
        :search-empty-description="lang.GetText(`descnomatchingprompt`)"
        @use="prompt => vStore.params.prompts[0] = prompt"
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
        :title="lang.GetText(`llpromptstyles`)"
        :empty-description="lang.GetText(`descnostyles`)"
        :search-empty-description="lang.GetText(`descsearcchnostyles`)"
        :searchText="lang.GetText(`llsearchbystyle`)"
        :useText="lang.GetText(`llusestyle`)"
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
                <h4>{{lang.GetText(`promptafterapply`)}}</h4>
                <div>
                    <span>{{getStyle(itemProps.item).promptSplit[0]}}</span>
                    <span style="color: var(--el-color-primary)">{{store.prompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item).promptSplit[1]}}</span>
                </div>
                <div v-if="getStyle(itemProps.item).negativePromptSplit || getStyle(itemProps.item).prompt.includes('{np}')">
                    <h4>{{lang.GetText(`negativeprompt`)}}</h4>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[0] || ""}}</span>
                    <span style="color: var(--el-color-primary)">{{store.negativePrompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[1] || ""}}</span>
                </div>
            </div>
        </template>
    </DialogList>

    <form-input
        v-if="vStore.params.model != 'Kandinsky'"
        :label="lang.GetText(`llnegativeprompt`)"
        prop="negativePrompt"
        v-model="vStore.params.neg_prompts"
        autosize
        resize="vertical"
        type="textarea"
        :placeholder="lang.GetText(`placeholdernegative`)"
        :info="lang.GetText(`ttnegativeprompt`)"
        label-position="top"
        :spanWidth=2
        @focus="selectInput(-1)"
        @blur="deselectInput(-1)"
    >
        <template #inline>
            <el-tooltip :content="lang.GetText(`lladdnegativeprompt`)" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => store.pushToNegativeLibrary(vStore.params.neg_prompts)" :icon="FolderChecked"/>
            </el-tooltip>
            <el-tooltip :content="lang.GetText(`llnegativeprompts`)" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: 2px; width: 95%;" @click="() =>  negativePromptLibrary = true" :icon="FolderOpened"/>
            </el-tooltip>
        </template>
    </form-input>
    <form-input
        v-if="vStore.params.model == 'Kandinsky'"
        :label="lang.GetText(`llnegativepriorprompt`)"
        prop="negativePriorPrompt"
        v-model="vStore.params.neg_prompts"
        autosize
        resize="vertical"
        type="textarea"
        :placeholder="lang.GetText(`placeholdernegative`)"
        label-position="top"
        :spanWidth=2
        @focus="selectInput(-1)"
        @blur="deselectInput(-1)"
    >
        <template #inline>
            <el-tooltip :content="lang.GetText(`lladdnegativeprompt`)" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: -5px; width: 95%;" @click="() => store.pushToNegativeLibrary(vStore.params.neg_prompts)" :icon="FolderChecked"/>
            </el-tooltip>
            <el-tooltip :content="lang.GetText(`llnegativeprompts`)" placement="right">
                <el-button class="small-btn" style="margin-left: 5%; margin-top: 2px; width: 95%;" @click="() =>  negativePromptLibrary = true" :icon="FolderOpened"/>
            </el-tooltip>
        </template>
    </form-input>
    <DialogList
        v-model="negativePromptLibrary"
        :title="lang.GetText(`llnegativeprompts`)"
        :list="store.negativePromptLibrary"
        :empty-description="lang.GetText(`descnonegativeprompts`)"
        :search-empty-description="lang.GetText(`descnomatchingnegativeprompts`)"
        :search-text="lang.GetText(`llsearchbyprompt`)"
        :deleteText="lang.GetText(`lldeletepreset`)"
        :useText="lang.GetText(`llusepreset`)"
        @use="negPrompt => vStore.params.neg_prompts = negPrompt"
        @delete="store.removeFromNegativeLibrary"
    />

    <form-input
        v-if="vStore.params.model == 'Kandinsky'"
        :label="lang.GetText(`llnegativedecoderprompt`)"
        prop="negativeDecoderPrompt"
        v-model="vStore.params.neg_decoder_prompt"
        autosize
        resize="vertical"
        type="textarea"
        :placeholder="lang.GetText(`placeholdernegative`)"
        label-position="top"
        :spanWidth=2
    >
    </form-input>
</template>