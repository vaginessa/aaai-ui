import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import type { FormRules } from "element-plus";
import { reactive, ref } from "vue";

export type ModelGenerationVideo = {
    prompts?: string[];
    steps?: number;
    height?: number;
    width?: number;
    desired_duration?: number;
    fps?: number;
    cfg_scale?: number;
};

function getDefaultStore() {
    return <ModelGenerationVideo>{
        prompts: ["Castle"],
        steps: 30,
        width: 512,
        height: 512,
        desired_duration: 5,
        fps: 10,
        cfg_scale: 7,
    }
}

const generateFormBaseRules = reactive<FormRules>({
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

export const useVideoGeneratorStore = defineStore("VideoGenerator", () => {

    async function generateVideo() {

    }

    const params = useLocalStorage<ModelGenerationVideo>("videoParams", getDefaultStore());

    const minFPS = ref(1);
    const maxFPS = ref(30);
    const minDuration = ref(1);
    const maxDuration = ref(5);
    const minWidth = ref(64);
    const maxWidth = ref(1024);
    const minHeight = ref(64);
    const maxHeight = ref(1024);
    const minCfgScale = ref(1);
    const maxCfgScale = ref(50);
    const minSteps = ref(1);
    const maxSteps = ref(30);

    const generating = ref(false);
    const cancelled = ref(false);

    const videoUrl = ref('none');

    const models = ref([
    ])

    return {
        minFPS,
        maxFPS,
        minDuration,
        maxDuration,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        minCfgScale,
        maxCfgScale,
        minSteps,
        maxSteps,
        params,
        generating,
        cancelled,
        videoUrl,
        generateFormBaseRules,
        generateVideo,
    }
})