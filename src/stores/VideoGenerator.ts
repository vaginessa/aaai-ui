import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { ElMessage, type FormRules } from "element-plus";
import { computed, reactive, ref } from "vue";
import { useUserStore } from "./user";
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';
import { useOptionsStore } from "./options";
import { validateResponse } from "@/utils/validate";
import { useLanguageStore } from '@/stores/i18n';
export type ModelGenerationVideo = {
    prompts?: string[];
    neg_prompts?: string;
    neg_decoder_prompt?: string;
    seed?: number[];
    sampler?: string;
    model?: string;
    steps?: number;
    prior_steps?: number;
    height?: number;
    width?: number;
    desired_duration?: number;
    fps?: number;
    cfg_scale?: number;
    prior_cfg_scale?: number;
    upsampler?: string; //None | RealESRGAN for now
    interpolate?: string; //None | FilmNet
    timestointerpolate?: number;
};

function getDefaultStore() {
    MersenneTwister();
    return <ModelGenerationVideo>{
        prompts: [""],
        neg_prompts: "",
        neg_decoder_prompt: "",
        seed: [genrand_int32()],
        sampler: "Euler",
        model: "Deliberate",
        steps: 30,
        prior_steps: 25,
        height: 512,
        width: 512,
        desired_duration: 5,
        fps: 10,
        cfg_scale: 6,
        prior_cfg_scale: 4,
        upsampler: "None",
        interpolate: "None",
        timestointerpolate: 2
    }
}

export type ModelGenerationParallaxVideo = {
    boomerang_clip?: boolean;
    predict_music?: boolean;
    autozoom?: boolean;
    frame_rate?: number;
    zoom_amount?: number;
    zoom_duration?: number;
    start_x_offset?: number;
    start_y_offset?: number;
    end_x_offset?: number;
    end_y_offset?: number;
};

function getDefaultParallaxStore() {
    return <ModelGenerationParallaxVideo>{
        boomerang_clip: true,
        predict_music: false,
        autozoom: true,
        frame_rate: 25,
        shift_amount_x: 100,
        shift_amount_y: 100,
        zoom_amount: 1.25,
        zoom_duration: 3.0,
        start_x_offset: 0,
        start_y_offset: 0,
        end_x_offset: 0,
        end_y_offset: 0,
    }
}

export interface IModelData {
    ID?: number;
    Name?: string;
}

export const useVideoGeneratorStore = defineStore("VideoGenerator", () => {


    const lang = useLanguageStore();
    const optionsStore = useOptionsStore();
    

    const generateFormBaseRules = reactive<FormRules>({
        prompt: [{
            required: true,
            message: lang.GetText(`vidpleaseinputprompt`),
            trigger: 'change'
        }],
        apiKey: [{
            required: true,
            message: lang.GetText(`vidpleaseinputapi`),
            trigger: 'change'
        }]
    });
    
    function generateClicked() {
        generateVideo();
    }

    function resetParallaxParams() {
        parallaxParams.value = getDefaultParallaxStore();
    }

    const LastJobID = ref("");
    const QueuePosition = ref(0);
    const latestSeed = ref();

    const sourceImage = ref("");

    async function generateImageClicked() {
        if (LastJobID.value !== "" ) {
            videoUrl.value = 'none'
            const url = `https://api.artificial-art.eu/video/get?jobid=${LastJobID.value}`;
            fetch(url);
            LastJobID.value = "";
        }
        MersenneTwister();
        generating.value = true;
        queueStatus.value = lang.GetText(`vidwaiting`);

        const Payload = {
            "Mode": "Picture",
            "Prompt": params.value.prompts ? params.value.prompts[0] : "",
            "NegPriorPrompt": params.value.neg_prompts || "",
            "NegDecPrompt": params.value.neg_decoder_prompt || "",
            "Width": params.value.width,
            "Height": params.value.height,
            "GuidanceScale": params.value.cfg_scale,
            "PriorGuidanceScale": params.value.prior_cfg_scale,
            "Steps": params.value.steps,
            "PriorSteps": params.value.prior_steps,
            "Model": AvailableModels.value.indexOf(params.value.model || "Deliberate"),
            "Scheduler": params.value.sampler,
        }
        const url = `https://api.artificial-art.eu/video/push`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({UserID: useUserStore().userId, Payload: Payload, TotalFrames: 0}),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });
        const resAddJSON = await response.json();
        let requestRunning = resAddJSON['success'];
        if(!requestRunning) {
            useUserStore().UpdateInternally();
            ElMessage({
                message: lang.GetText("viderrorwhilerequesting",{"%msg%": requestRunning['msg']}),
                type: 'error',
            });
            generating.value = false;
            return;
        }
        while (requestRunning) {
            await sleep(1250);
            if (cancelled.value) break;
            const url = `https://api.artificial-art.eu/video/status?jobid=${resAddJSON['job_id']}`;
            const response = await fetch(url);
            const resJSON = await response.json();
            if(resJSON["success"]) {
                queueStatus.value = resJSON["msg"];
                if(resJSON["state"] == 0) {
                    progress.value = 0;
                    if(queueStatus.value == "") {
                        if(resJSON['queue'] > 0) {
                            QueuePosition.value = resJSON['queue'];
                            queueStatus.value = lang.GetText(`vidqueuepos`, {"%QUEUE%": resJSON['queue']});
                        } else {
                            queueStatus.value = lang.GetText(`vidwaiting`);
                        }
                    }
                }
                if(resJSON['finished'] == 1) {
                    requestRunning = false;
                }
                
                if(queueStatus.value == 'Job errored out!') {
                    ElMessage({
                        message: lang.GetText('viderrorwhilerendering', {'%MSG%': requestRunning['msg']}),
                        type: 'error',
                    });
                    requestRunning = false;
                    cancelled.value = true;
                }
            }
        }
        if (cancelled.value) {
            LastJobID.value = "";
            videoUrl.value = "none";
            cancelled.value = false;
            generating.value = false;
            const url = `https://api.artificial-art.eu/video/cancel?jobid=${resAddJSON['job_id']}`;
            await fetch(url);
        } else {
            LastJobID.value = resAddJSON['job_id'];
            videoUrl.value = `https://api.artificial-art.eu/AIVideos/${resAddJSON['job_id']}.png`;
        }
        generating.value = false;
    }

    async function generateParallaxClicked() {
        if (LastJobID.value !== "" ) {
            videoUrl.value = 'none'
            const url = `https://api.artificial-art.eu/video/get?jobid=${LastJobID.value}`;
            fetch(url);
            LastJobID.value = "";
        }
        MersenneTwister();
        generating.value = true;
        queueStatus.value = lang.GetText(`vidwaiting`);
        if(sourceImage.value === undefined || sourceImage.value === '') {
            ElMessage({
                message: lang.GetText(`vidnofilefound`),
                type: 'error',
            });
            generating.value = false;
            return;
        }
        const Payload = {
            "Mode": "Parallax",
            "boomerang_clip": parallaxParams.value.boomerang_clip,
            "autozoom": parallaxParams.value.autozoom,
            "start_x_offset": parallaxParams.value.start_x_offset,
            "start_y_offset": parallaxParams.value.start_y_offset,
            "end_x_offset": parallaxParams.value.end_x_offset,
            "end_y_offset": parallaxParams.value.end_y_offset,
            "predict_music": parallaxParams.value.predict_music,
            "frame_rate": parallaxParams.value.frame_rate,
            "zoom_amount": parallaxParams.value.zoom_amount,
            "zoom_duration": parallaxParams.value.zoom_duration,
            "Image": sourceImage.value
        }
        const url = `https://api.artificial-art.eu/video/push`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({UserID: useUserStore().userId, Payload: Payload, TotalFrames: 0}),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });
        const resAddJSON = await response.json();
        let requestRunning = resAddJSON['success'];
        if(!requestRunning) {
            useUserStore().UpdateInternally();
            ElMessage({
                message: `Error while requesting! ${requestRunning['msg']}...`,
                type: 'error',
            });
            generating.value = false;
            return;
        }
        while (requestRunning) {
            await sleep(1250);
            if (cancelled.value) break;
            const url = `https://api.artificial-art.eu/video/status?jobid=${resAddJSON['job_id']}`;
            const response = await fetch(url);
            const resJSON = await response.json();
            if(resJSON["success"]) {
                queueStatus.value = resJSON["msg"];
                if(resJSON["state"] == 0) {
                    progress.value = 0;
                    if(queueStatus.value == "") {
                        if(resJSON['queue'] > 0) {
                            QueuePosition.value = resJSON['queue'];
                            queueStatus.value = `Queue Position ${resJSON['queue']}`;
                        } else {
                            queueStatus.value = "Waiting";
                        }
                    }
                }
                if(resJSON['finished'] == 1) {
                    requestRunning = false;
                }
                
                if(queueStatus.value == 'Job errored out!') {
                    ElMessage({
                        message: `Error while rendering, most likely wrong shift values! ${requestRunning['msg']}...`,
                        type: 'error',
                    });
                    requestRunning = false;
                    cancelled.value = true;
                }
            }
        }
        if (cancelled.value) {
            LastJobID.value = "";
            videoUrl.value = "none";
            cancelled.value = false;
            generating.value = false;
            const url = `https://api.artificial-art.eu/video/cancel?jobid=${resAddJSON['job_id']}`;
            await fetch(url);
        } else {
            LastJobID.value = resAddJSON['job_id'];
            videoUrl.value = `https://api.artificial-art.eu/AIVideos/${resAddJSON['job_id']}.mp4`;
        }
        generating.value = false;
    }

    async function generatePrompt(id: number) {
        document.getElementById('ovl')?.classList.add('active');
        MersenneTwister(Math.random());
        let par = {UserID: useUserStore().userId, Prompt: "", Seed: 0}
        if(params.value.prompts !== undefined && params.value.prompts[id] != "") {
            par.Prompt = params.value.prompts[id]
        }
        par.Seed = genrand_int32()
        const url = `https://api.artificial-art.eu/prompt/query`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(par),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });
        const resJSON = await response.json();
        let requestRunning = resJSON['success'];
        while (requestRunning) {
            await sleep(1250);
            const url = `https://api.artificial-art.eu/prompt/get?u=${useUserStore().userId}&j=${resJSON['uid']}`;
            const response = await fetch(url);
            const resStatJSON = await response.json();
            if (resStatJSON['success']) {
                params.value.prompts[id] = resStatJSON['prompt']
                requestRunning = false
                document.getElementById('ovl')?.classList.remove('active');
            }
        }
    }

    async function generateVideo() {
        
        if (LastJobID.value !== "" ) {
            videoUrl.value = 'none'
            const url = `https://api.artificial-art.eu/video/get?jobid=${LastJobID.value}`;
            fetch(url);
            LastJobID.value = "";
        }

        MersenneTwister();

        generating.value = true;
        progress.value = 0;
        currentFrame.value = 0;
        totalFrames.value = 0;
        queueStatus.value = lang.GetText(`vidwaiting`);

        if(params.value.prompts === undefined) {
            ElMessage({
                message: lang.GetText(`vidnopromptset`),
                type: 'error',
            });
            return;
        }
        if(params.value.seed === undefined) {
            ElMessage({
                message: lang.GetText(`vidnoseedset`),
                type: 'error',
            });
            return;
        }

        params.value.seed.forEach((seed, index) => {
            if(seed == undefined || seed as any == '')
                params.value.seed[index] = genrand_int32();
        });

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

        params.value.upsampler = "None";

        const Payload = {
            "Mode": "Video",
            "Model": AvailableModels.value.indexOf(params.value.model || "Deliberate"),
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
            "Upsampler": params.value.upsampler,
            "Interpolate": params.value.interpolate,
            "TimesToInterpolate": params.value.timestointerpolate
        }

        var calculatedTotalFrames = 0;
        if (params.value.interpolate !== undefined && params.value.interpolate !== 'None') {
            calculatedTotalFrames = (((params.value.fps || 1) * (params.value.desired_duration || 1) - 1) * (2**(params.value.timestointerpolate || 1) - 1)) + ((params.value.fps || 1) * (params.value.desired_duration || 1))
        } else {
            calculatedTotalFrames = ((params.value.fps || 1) * (params.value.desired_duration || 1))
        }

        const url = `https://api.artificial-art.eu/video/push`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({UserID: useUserStore().userId, Payload: Payload, TotalFrames: calculatedTotalFrames}),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });

        const resAddJSON = await response.json();

        let requestRunning = resAddJSON['success'];
        
        if(!requestRunning) {
            generating.value = false;
            useUserStore().UpdateInternally();
            ElMessage({
                message: `Error while requesting! ${requestRunning['msg']}...`,
                type: 'error',
            });
            return;
        }
        
        while (requestRunning) {
            await sleep(1250);
            if (cancelled.value) break;

            const url = `https://api.artificial-art.eu/video/status?jobid=${resAddJSON['job_id']}`;
            const response = await fetch(url);
            const resJSON = await response.json();

            if(resJSON["success"]) {
                
                queueStatus.value = resJSON["msg"];

                if(resJSON["state"] == 0) {
                    progress.value = 0;
                    if(queueStatus.value == "") {
                        if(resJSON['queue'] > 0) {
                            QueuePosition.value = resJSON['queue'];
                            queueStatus.value = `Queue Position ${resJSON['queue']}`;
                        } else {
                            queueStatus.value = lang.GetText(`vidwaiting`);
                        }
                    }
                } else if(resJSON["state"] == 10) {
                    totalFrames.value = resJSON["raw_total"];
                    currentFrame.value = resJSON["raw_count"];
                    if(resJSON["raw_total"] > 0 && resJSON["raw_count"] > 0) {
                        progress.value = (resJSON["raw_count"] / resJSON["raw_total"]) * 100;
                    } else {
                        progress.value = 0;
                    }
                } else if(resJSON["state"] == 20) {
                    totalFrames.value = resJSON["intl_total"];
                    currentFrame.value = resJSON["intl_count"];
                    if(resJSON["intl_total"] > 0 && resJSON["intl_count"] > 0) {
                        progress.value = (resJSON["intl_count"] / resJSON["intl_total"]) * 100;
                    } else {
                        progress.value = 0;
                    }
                } else if(resJSON["state"] == 99) {
                    totalFrames.value = resJSON["video_total"];
                    currentFrame.value = resJSON["video_count"];
                    if(resJSON["video_total"] > 0 && resJSON["video_count"] > 0) {
                        progress.value = (resJSON["video_count"] / resJSON["video_total"]) * 100;
                    } else {
                        progress.value = 0;
                    }
                }

                if(resJSON['finished'] == 1) {
                    requestRunning = false;
                }

            }
        }

        if (cancelled.value) {
            LastJobID.value = "";
            videoUrl.value = "none";
            cancelled.value = false;
            const url = `https://api.artificial-art.eu/video/cancel?jobid=${resAddJSON['job_id']}`;
            await fetch(url);
        } else {
            LastJobID.value = resAddJSON['job_id'];
            videoUrl.value = `https://api.artificial-art.eu/AIVideos/${resAddJSON['job_id']}.mp4`;
        }

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
        const isQueueLengthResonable = queueLength <= 10;
        const isWorkerOnline = onlineWorkers >= 1;

        if(!isUserAllowed.allow) {
            generateMsg.value = isUserAllowed.msg.value;
        }
        if(!isQueueLengthResonable) {
            generateMsg.value = lang.GetText(`vidqueuetoolong`);
        }
        if(!isWorkerOnline) {
            generateMsg.value = lang.GetText(`vidnoworkeronline`);
        }

        generateLock.value = !(isUserAllowed.allow && isQueueLengthResonable && isWorkerOnline);
    }

    const generateMsg = ref('');

    const params = useLocalStorage<ModelGenerationVideo>("videoParams", getDefaultStore());
    const parallaxParams = useLocalStorage<ModelGenerationParallaxVideo>("parallaxParams", getDefaultParallaxStore());

    function getTime() {
        var calculatedTotalFrames = 0;
        if (params.value.interpolate !== undefined && params.value.interpolate !== 'None') {
            calculatedTotalFrames = (((params.value.fps || 1) * (params.value.desired_duration || 1) - 1) * (2**(params.value.timestointerpolate || 1) - 1)) + ((params.value.fps || 1) * (params.value.desired_duration || 1))
        } else {
            calculatedTotalFrames = ((params.value.fps || 1) * (params.value.desired_duration || 1))
        }
        return calculatedTotalFrames + " Frames";
    }

    const AvailableModels = ref<string[]>([]);
    
    async function updateAvailableModels() {
        const response = await fetch(`https://api.artificial-art.eu/video/models`);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, lang.GetText(`vidfailedtogetmodels`))) return;
        const jsonModels: IModelData[] = resJSON['models']
        AvailableModels.value = [];
        jsonModels.forEach((el) => {
            if(el.Name != undefined) {
                AvailableModels.value.push(el.Name);
            }
        });
        AvailableModels.value.push('Kandinsky');
    }

    const AvailableSamplers = [
        "DDIM", 
        "DPM",
        "DDPM", 
        "DEIS",
        "EulerA", 
        "Euler",
        "Heun", 
        "K_DPM2_A",
        "K_DPM2",
        "LMSD", 
        "PNDM",
        "UniPC",
    ];

    const AvailableInterpolations = [
        "None",
        "L1",
        "Style",
        "VGG"
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
    const maxFPS = computed(() => {
        if((params.value.timestointerpolate || 0) == 1)
            return 10;
        if((params.value.timestointerpolate || 0) == 2)
            return 8;
        if((params.value.timestointerpolate || 0) == 3)
            return 6;
        if((params.value.timestointerpolate || 0) == 4)
            return 4;
        if((params.value.timestointerpolate || 0) == 5)
            return 2;
        if(optionsStore.allowLargerParams)
            return 24;
        return 12;
    });
    const minDuration = ref(1);
    const maxDuration = computed(() => {
        if(optionsStore.allowLargerParams)
            return 20;
        return 15;
    });
    const minWidth = ref(64);
    const maxWidth = ref(768);
    const minHeight = ref(64);
    const maxHeight = ref(768);
    const minCfgScale = ref(-10);
    const maxCfgScale = ref(50);
    const minSteps = ref(1);
    const maxSteps = computed(() => {
        if(optionsStore.allowLargerParams)
            return 150;
        return 75;
    });
    const minTimestointerpolate = ref(1);
    const maxTimestointerpolate = ref(5);

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

    updateAvailableModels()

    return {
        AvailableInterpolations,
        minTimestointerpolate,
        maxTimestointerpolate,
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
        generateMsg,
        latestSeed,
        generateClicked,
        updateNetworkHealth,
        getTime,
        getProgressWriting,
        deleteVideo,
        downloadVideo,
        generatePrompt,
        sourceImage,
        generateParallaxClicked,
        parallaxParams,
        resetParallaxParams,
        generateImageClicked
    }
})
