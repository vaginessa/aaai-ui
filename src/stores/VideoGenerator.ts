import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import type { FormRules } from "element-plus";
import { reactive, ref } from "vue";
import { useUserStore } from "./user";
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';

export type ModelGenerationVideo = {
    prompts?: string[];
    neg_prompts?: string;
    seed?: number[];
    sampler?: string;
    model?: string;
    steps?: number;
    height?: number;
    width?: number;
    desired_duration?: number;
    fps?: number;
    cfg_scale?: number;
};

function getDefaultStore() {
    MersenneTwister(Math.random());
    return <ModelGenerationVideo>{
        prompts: [""],
        neg_prompts: "",
        seed: [genrand_int32()],
        sampler: "Euler",
        model: "Deliberate",
        steps: 30,
        height: 512,
        width: 512,
        desired_duration: 5,
        fps: 10,
        cfg_scale: 6,
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

    function generateClicked() {
        generateVideo();
    }

    const LastJobID = ref("");
    const QueuePosition = ref(0);
    const latestSeed = ref();

    async function generateVideo() {
        
        if (LastJobID.value !== "" ) {
            videoUrl.value = 'none'
            const url = `https://api.artificial-art.eu/video/get?jobid=${LastJobID.value}`;
            fetch(url);
            LastJobID.value = "";
        }

        MersenneTwister(Math.random());

        generating.value = true;
        progress.value = 0;
        currentFrame.value = 0;
        totalFrames.value = 0;
        queueStatus.value = "waiting";

        if(params.value.prompts === undefined || params.value.seed === undefined)
            return; // Add error handling

        if (params.value.prompts?.length > params.value.seed?.length) {
            while (params.value.prompts?.length > params.value.seed?.length) {
                params.value.seed?.push(params.value.seed[params.value.seed?.length - 1]);
            }
        } else if (params.value.prompts?.length < params.value.seed?.length) {
            while (params.value.prompts?.length < params.value.seed?.length) {
                params.value.prompts?.push(params.value.prompts[params.value.prompts?.length - 1]);
            }
        }  else if (params.value.prompts?.length == 1 && params.value.seed?.length == 1) {
            params.value.prompts?.push(params.value.prompts[params.value.prompts?.length - 1]);
            params.value.seed?.push(params.value.seed[params.value.seed?.length - 1]);
        } 

        const Payload = {
            "Model": AvailableModels.indexOf(params.value.model || "Deliberate"),
            "FPS": params.value.fps,
            "Duration": params.value.desired_duration,
            "Prompt": {
                "Positiv": params.value.prompts,
                "Negative": params.value.neg_prompts
            },
            "Seeds": params.value.seed,
            "Width": params.value.width,
            "Height": params.value.height,
            "GuidanceScale": params.value.cfg_scale,
            "Steps": params.value.steps,
            "Scheduler": params.value.sampler,
        }

        const url = `https://api.artificial-art.eu/video/push`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({UserID: useUserStore().userId, Payload: Payload}),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });

        const resAddJSON = await response.json();

        let requestRunning = true;
        
        while (requestRunning) {
            await sleep(1250);
            if (cancelled.value) break;

            const url = `https://api.artificial-art.eu/video/status?jobid=${resAddJSON['job_id']}`;
            const response = await fetch(url);
            const resJSON = await response.json();

            if(resJSON["success"]) {
                totalFrames.value = resJSON["total"];
                currentFrame.value = resJSON["frame"];
                
                if(resJSON['queue'] > 0) {
                    QueuePosition.value = resJSON['queue'];
                    queueStatus.value = `queue position ${resJSON['queue']}`;
                } else {
                    if(resJSON["total"] > 0 && resJSON["frame"] > 0) {
                        progress.value = (resJSON["frame"] / resJSON["total"]) * 100;
                    } else {
                        progress.value = 0;
                    }
                    if(resJSON['finished'] == 1) {
                        queueStatus.value = "finished";
                        requestRunning = false;
                    } else if(resJSON['generating'] == 1) {
                        queueStatus.value = "generating";
                    }
                }
            }
        }

        LastJobID.value = resAddJSON['job_id'];
        videoUrl.value = `https://api.artificial-art.eu/AIVideos/${resAddJSON['job_id']}.mp4`;

        generating.value = false;
    }
    
    function sleep(ms: number) {
        return new Promise(res=>setTimeout(res, ms));
    }

    var queueLength = 0;
    var onlineWorkers = 0;

    const generateLock = ref(true);

    async function updateNetworkHealth() {
        const url = `https://api.artificial-art.eu/video/health`;
        const response = await fetch(url);
        const resJSON = await response.json();

        queueLength = resJSON['queue'];
        onlineWorkers = resJSON['online'];

        const isUserAllowed = useUserStore().videoAllowence();
        const isQueueLengthResonable = queueLength <= 5;
        const isWorkerOnline = onlineWorkers >= 1;

        generateLock.value = !(isUserAllowed && isQueueLengthResonable && isWorkerOnline);
    }

    const params = useLocalStorage<ModelGenerationVideo>("videoParams", getDefaultStore());

    function getTime() {
        let TotalFrame = (params.value.fps || 1) * (params.value.desired_duration || 1);
        return new Date((TotalFrame * 4) * 1000).toISOString().slice(11, 19);
    }

    const AvailableSamplers = [
        "DDIM", 
        "DPM", 
        "EulerA", 
        "Euler", 
        "LMSD", 
        "PNDM"
    ];

    const AvailableModels = [
        "Waifu Diffusion", 
        "Deliberate", 
        "Openjourney", 
        "Dreamlike Photoreal 2.0", 
        "Counterfeit V2.5",
        "Pastel mix",
        "Ghibli Diffusion",
        "Hassanblend 1.5.1.2",
        "Hentai Diffusion",
        "Epic Diffusion",
        "Inkpunk Diffusion",
        "Dungeons & Diffusion",
        "Abyss Orange Mix 2",
        "A Certainty",
        "URPM",
        "Realistic Vision",
        "Anything v4.5",
        "HARDBlend",
        "Map Unfurnished",
        "CiderMix",
        "FantasyMix"
    ];

    function deleteVideo() {
        videoUrl.value = 'none'
        const url = `https://api.artificial-art.eu/video/get?jobid=${LastJobID.value}`;
        fetch(url);
        LastJobID.value = "";
    }

    const progress = ref(0);
    const currentFrame = ref(0);
    const totalFrames = ref(0);
    const queueStatus = ref("waiting");

    const minFPS = ref(1);
    const maxFPS = ref(30);
    const minDuration = ref(1);
    const maxDuration = ref(5);
    const minWidth = ref(64);
    const maxWidth = ref(768);
    const minHeight = ref(64);
    const maxHeight = ref(768);
    const minCfgScale = ref(1);
    const maxCfgScale = ref(50);
    const minSteps = ref(1);
    const maxSteps = ref(30);

    const generating = ref(false);
    const cancelled = ref(false);

    const videoUrl = ref('none');

    function getProgressWriting() {
        if (currentFrame.value > 0 && totalFrames.value > 0) {
            return `[${currentFrame.value}/${totalFrames.value}]`;
        } else {
            return `...`;
        } 
    }

    function downloadVideo()
    {
        const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
        a.href = videoUrl.value;
        a.download = (`${params.value.seed[0]}-${params.value.prompts[0]}.mp4`).replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd(); 
        document.body.appendChild(a);
        a.click();     
        document.body.removeChild(a);
    }

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
        AvailableSamplers,
        AvailableModels,
        progress,
        currentFrame,
        totalFrames,
        queueStatus,
        generateLock,
        latestSeed,
        generateClicked,
        updateNetworkHealth,
        getTime,
        getProgressWriting,
        deleteVideo,
        downloadVideo,
    }
})
