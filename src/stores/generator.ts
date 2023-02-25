import { computed, h, ref, reactive } from "vue";
import { defineStore } from "pinia";
import type { ModelGenerationInputStable, GenerationStable, RequestAsync, GenerationInput, ActiveModel, RequestStatusCheck } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import router from "@/router";
import { fabric } from "fabric";
import { useCanvasStore } from "./canvas";
import { useDashboardStore } from "./dashboard";
import { useLocalStorage } from "@vueuse/core";
import { MODELS_DB_URL, POLL_MODELS_INTERVAL, DEBUG_MODE, POLL_STYLES_INTERVAL, MAX_PARALLEL_IMAGES, MAX_PARALLEL_REQUESTS } from "@/constants";
import { convertToBase64 } from "@/utils/base64";
import { validateResponse } from "@/utils/validate";
import { ElNotification } from "element-plus";
import { useWorkerStore } from '@/stores/workers';
import { BASE_URL_STABLE } from "@/constants";
import { type FormRules } from 'element-plus';
import { genrand_int32, MersenneTwister } from '@/utils/mersenneTwister';

function getDefaultStore() {
    return <ModelGenerationInputStable>{
        steps: 30,
        n: 1,
        sampler_name: "k_euler",
        width: 512,  // make sure these are divisible by 64
        height: 512, // make sure these are divisible by 64
        cfg_scale: 7,
        clip_skip: 1,
        seed_variation: 1000,
        seed: "",
        karras: true,
        denoising_strength: 0.75,
        tiling: false,
        hires_fix: false,
        control_type: "normal",
    }
}

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export type GenerationStableArray = GenerationStable & Array<GenerationStable>
export interface IModelData {
    name?: string;
    count?: number;
    performance?: number;
    description?: string;
    trigger?: string[];
    showcases?: string[];
    style?: string;
    nsfw?: boolean;
    type?: string;
    eta?: number;
    queued?: number;
}

export interface IStyleData {
    prompt: string;
    model: string;
    sampler_name?: string;
    width?: number;
    height?: number;
}

export type ICurrentGeneration = GenerationInput & {
    jobId: string;
    gathered: boolean;
    waitData?: RequestStatusCheck;
}

interface ITypeParams {
    sourceProcessing?: "inpainting" | "img2img" | "outpainting";
    sourceImage?: string;
    maskImage?: string;
}

interface IPromptHistory {
    starred: boolean;
    prompt: string;
    timestamp: number;
}

type IGeneratorType = 'Text2Img' | 'Img2Img' | 'Inpainting' | 'ControlNet' | 'Rating'
type INSFW = "Enabled" | "Disabled" | "Censored"
type ITrustedOnly = "All Workers" | "Trusted Only"
type IMultiModel = "Enabled" | "Disabled"
type IGroupedModel ={ label: string; options: {label: string; value: string;}[] }[];

export const useGeneratorStore = defineStore("generator", () => {
    const generatorType = useLocalStorage<IGeneratorType>("generationType", "Text2Img");

    const prompt = useLocalStorage("lastPrompt", "")
    const promptHistory = useLocalStorage<IPromptHistory[]>("promptHistory", []);
    const negativePrompt = useLocalStorage("lastNegativePrompt", "")
    const negativePromptLibrary = useLocalStorage<string[]>("negativeLibrary", []);
    const params = useLocalStorage<ModelGenerationInputStable>("params", getDefaultStore());
    const nsfw   = useLocalStorage<INSFW>("nsfw", "Enabled");
    const trustedOnly = useLocalStorage<ITrustedOnly>("trustedOnly", "All Workers");

    const availablePostProcessors: ("GFPGAN" | "RealESRGAN_x4plus" | "CodeFormers")[] = ["GFPGAN", "RealESRGAN_x4plus", "CodeFormers"];

    const availableControlType: ('canny' | 'hed' | 'depth' | 'normal' | 'openpose' | 'seg' | 'scribble' | 'fakescribbles' | 'hough')[] = ['canny', 'hed', 'depth', 'normal', 'openpose', 'seg', 'scribble', 'fakescribbles', 'hough'];

    const availableModelsGrouped = ref<IGroupedModel>([]);
    const modelsData = ref<IModelData[]>([]);
    const modelDescription = computed(() => {
        if (selectedModel.value === "Random!") {
            return "Generate using a random model.";
        }
        return selectedModelData.value?.description || "Not Found!";
    })
    const multiModelSelect = useLocalStorage<IMultiModel>("multiModelSelect", "Disabled");
    const selectedModel = useLocalStorage("selectedModel", "stable_diffusion");
    const selectedModelMultiple = useLocalStorage("selectedModelMultiple", ["stable_diffusion"]);
    const selectedModelData = computed<IModelData>(() => modelsData.value.find(el => el.name === selectedModel.value) || {});

    const multiControlTypeSelect = useLocalStorage<IMultiModel>("multiControlTypeSelect", "Disabled");
    const selectedControlTypeMultiple = useLocalStorage("selectedControlTypeMultiple", ["depth"]);
    
    const filteredAvailableModelsGrouped = computed(() => {
        if (availableModelsGrouped.value.length === 0) return [];

        var filtered;
        
        if (generatorType.value === "Inpainting") {
            filtered = [availableModelsGrouped.value.find(mg => mg.label == "inpainting")];
        } else {
            if (generatorType.value === "Img2Img") {
                filtered = availableModelsGrouped.value.filter(mg => mg.label !== "inpainting");
            } else {
                filtered = availableModelsGrouped.value;
                
                filtered.forEach(el => el.options = el.options.filter(
                    md => md.value !== "pix2pix" && md.value !== "stable_diffusion_inpainting" 
                ));
            }
        }

        let sModel = filtered.find(el2 => {
            if(!el2) return false;
            return el2.options.find(el => {
                return el.value == selectedModel.value;
            });
        });

        if(!sModel) {
            if(!filtered[0]) return [];
            selectedModel.value = filtered[0].options[0].value;
        }

        if (multiModelSelect !== undefined)
            if ((multiModelSelect.value || "") === "Enabled") 
                filtered = filtered.filter(el => el?.label !== "Extra");

        return filtered;
    })

    const styles = useLocalStorage<{[key: string]: IStyleData}>("styles", {});

    const getDefaultImageProps = (): ITypeParams => ({
        sourceProcessing: undefined,
        sourceImage: undefined,
        maskImage: undefined,
    })

    const inpainting = useLocalStorage<ITypeParams>("inpainting", {
        ...getDefaultImageProps(),
        sourceProcessing: "inpainting",
    })

    const img2img = useLocalStorage("img2img", <ITypeParams>{
        ...getDefaultImageProps(),
        sourceProcessing: "img2img",
    })

    const getImageProps = (type: typeof generatorType.value): ITypeParams => {
        if (type === "Inpainting") {
            return inpainting.value;
        }
        if (type === "Img2Img" || type === "ControlNet" ) {
            return img2img.value;
        }
        return getDefaultImageProps();
    }

    const currentImageProps = computed(() => getImageProps(generatorType.value));

    const uploadDimensions = ref("");

    const generating = ref(false);
    const cancelled = ref(false);
    const images    = ref<ImageData[]>([]);
    const gatheredImages = ref(0);
    const queue = ref<ICurrentGeneration[]>([]);
    const queueStatus = computed<RequestStatusCheck>(() => {
        const mergedWaitData: RequestStatusCheck = mergeObjects(queue.value.map(el => el.waitData || {}));
        mergedWaitData.queue_position = Math.round((mergedWaitData?.queue_position || 0) / queue.value.length);
        mergedWaitData.faulted = !queue.value.every(el => !el.waitData?.faulted)
        mergedWaitData.wait_time = (mergedWaitData?.wait_time || 0) / queue.value.length;
        return mergedWaitData;
    });

    const minDimensions = ref(64);
    const maxDimensions = computed(() => useOptionsStore().allowLargerParams === "Enabled" ? 3072 : 1024);
    const minImages = ref(1);
    const maxImages = ref(20);
    const minSteps = ref(1);
    const maxSteps = computed(() => useOptionsStore().allowLargerParams === "Enabled" ? 500 : 50);
    const minCfgScale = computed(() => useOptionsStore().allowLargerParams === "Enabled" ? -40 : 1);
    const maxCfgScale = ref(30);
    const minDenoise = ref(0.1);
    const maxDenoise = ref(1);
    const minClipSkip = ref(1);
    const maxClipSkip = ref(12);

    const totalImageCount = computed<number>(() => {
        const newPrompts = promptMatrix();
        let returnValue = newPrompts.length;
        if(multiModelSelect.value === "Enabled") 
        {
            returnValue *= selectedModelMultiple.value.length;
        }
        else
        {
            if(selectedModel.value === "All Models!")
            {
                returnValue *= filteredAvailableModelsGrouped.value.filter(el => el?.label !== "Extra").length;
            }
        }
        if(multiControlTypeSelect.value === "Enabled") 
        {
            returnValue *= selectedControlTypeMultiple.value.length || 0;
        }
        returnValue *= (params.value.n || 1);
        return returnValue;
    })

    const kudosCost = computed(() => {
        const result = Math.pow(((params.value.width as number) * (params.value.height as number)) - (64*64), 1.75) / Math.pow((1024*1024) - (64*64), 1.75);
        const steps = getAccurateSteps();
        let kudos = Math.round((((0.1232 * steps) + result * (0.1232 * steps * 8.75))) * 100) / 100;
        (params.value.post_processing || []).forEach( el => {
            kudos = Math.round((kudos * 1.2) * 100) / 100;
        });
        if(generatorType.value == "ControlNet")
            kudos = Math.round((kudos * 3) * 100) / 100;
        return kudos * (totalImageCount.value || 1);
    })

    function getAccurateSteps() {
        const { sourceImage, maskImage, sourceProcessing } = getImageProps(generatorType.value);
        if((params.value.sampler_name || "k_euler_a") == "k_dpm_adaptive") {
            return 50;
        }
        let result: number = params.value.steps || 0;
        if(['k_heun', "k_dpm_2", "k_dpm_2_a", "k_dpmpp_2s_a"].includes(params.value.sampler_name || "k_euler_a")) {
            result *= 2;
        }
        if(sourceImage && sourceProcessing == "img2img"){
            result *= params.value.denoising_strength || 0.8;
        }
        return result;
    }

    const canGenerate = computed(() => {
        const dashStore = useDashboardStore();
        const affordable = (dashStore.user.kudos as number) > kudosCost.value;
        const higherDimensions = (params.value.height as number) * (params.value.width as number) > 1024*1024;
        const higherSteps = (params.value.steps as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1) > 50;
        return affordable || (!higherDimensions && !higherSteps);
    })

    /**
     * Resets the generator store to its default state
     * */ 
    function resetStore()  {
        params.value = getDefaultStore();
        inpainting.value = getDefaultImageProps();
        img2img.value = getDefaultImageProps();
        images.value = [];
        useUIStore().showGeneratedImages = false;
        return true;
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

    /**
     * Generates images on the Horde; returns a list of image(s)
     * */ 
    async function generateImage(type:IGeneratorType) {
        if (type === "Rating") return [];
        if (prompt.value === "") return generationFailed("Failed to generate: No prompt submitted.");
        if (multiModelSelect.value === "Enabled" && selectedModelMultiple.value.length === 0) return generationFailed("Failed to generate: No model selected.");

        MersenneTwister(undefined);

        const canvasStore = useCanvasStore();
        const optionsStore = useOptionsStore();
        const uiStore = useUIStore();

        canvasStore.saveImages();
        const { sourceImage, maskImage, sourceProcessing } = getImageProps(type);
        
        let model = [selectedModel.value];
        const realModels = filteredAvailableModelsGrouped.value.filter(el => el?.label !== "Extra");
        if (selectedModel.value === "Random!") {
            let categoryId = Math.floor(Math.random() * realModels.length);
            let modelId = Math.floor(Math.random() * realModels[categoryId].options.length);
            model = [realModels[categoryId].options[modelId].value];
        } 
        if (selectedModel.value === "All Models!") {
            realModels.forEach(el => {
                el.options.forEach(el2 => {
                    model.push(el2.value);
                })
            })
        }

        pushToPromptHistory(prompt.value);

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached: GenerationInput[] = [];

        // Get all prompt matrices (example: {vase|pot}) + models and try to spread the batch size evenly
        const newPrompts = promptMatrix();
        const plannedSeeds = [];
        const requestCount = totalImageCount.value / (params.value.n || 1);
        for (let i = 0; i < (params.value.n || 1); i++) {
            plannedSeeds.push(params.value.seed == "" ? genrand_int32().toString() : params.value.seed);
        }
        for (let i = 0; i < requestCount; i++) {
            const selectCurrentItem = (arr: any[]) => arr[i % arr.length];
            const currentModel = multiModelSelect.value === "Enabled" ? selectCurrentItem(selectedModelMultiple.value) : selectCurrentItem(model);
            const currentControlType = multiControlTypeSelect.value === "Enabled" ? selectCurrentItem(selectedControlTypeMultiple.value) : params.value.control_type;
            const currentPrompt = selectCurrentItem(newPrompts);
            const currentSampler = currentModel.includes("stable_diffusion_2.0") ? "dpmsolver" : params.value.sampler_name
            for (let iN = 0; iN < (params.value.n || 1); iN++) {
                paramsCached.push({
                    prompt: currentPrompt,
                    params: {
                        ...params.value,
                        seed: params.value.seed == "" ? plannedSeeds[iN] : params.value.seed,
                        karras: params.value.karras == "Enabled" ? true : false,
                        tiling: params.value.tiling == "Enabled" ? true : false,
                        hires_fix: params.value.hires_fix == "Enabled" ? true : false,
                        seed_variation: params.value.seed === "" ? 1000 : 1,
                        post_processing: params.value.post_processing || [],
                        sampler_name: currentSampler,
                        n: 1,
                        control_type: type === "ControlNet" ? currentControlType : undefined,
                    },
                    nsfw: nsfw.value === "Enabled",
                    censor_nsfw: nsfw.value === "Censored",
                    trusted_workers: trustedOnly.value === "Trusted Only",
                    source_image: sourceImage?.split(",")[1],
                    source_mask: maskImage,
                    source_processing: sourceProcessing,
                    workers: optionsStore.getWokersToUse,
                    models: [currentModel],
                    r2: true,
                    shared: useOptionsStore().shareWithLaion === "Enabled",
                });
            }
        }

        if (DEBUG_MODE) console.log("Using generation parameters:", paramsCached)

        generating.value = true;
        uiStore.showGeneratedImages = false;

        // Push each item in the parameters array to the queue
        for (let i = 0; i < paramsCached.length; i++) {
            queue.value.push({
                ...paramsCached[i],
                jobId: "",
                gathered: false,
            })
        }

        // Reset variables
        images.value = [];
        gatheredImages.value = 0;

        function getMaxRequests(arr: GenerationInput[]) {
            let maxRequests = 0;
            let sum = 0;
            for (let i = 0; i < arr.length; i++) {
                const newSum = sum + (arr[i].params?.n || 1);
                if (newSum > MAX_PARALLEL_IMAGES) break;
                sum = newSum;
                maxRequests++;
            }
            return Math.min(maxRequests, MAX_PARALLEL_REQUESTS);
        }


        // Loop until queue is done or generation is cancelled
        let secondsElapsed = 0;
        while (!queue.value.every(el => el.gathered) && !cancelled.value) {
            if (queueStatus.value.done) await sleep(200);

            const nonGatheredQueue = queue.value.filter(el => !el.gathered);
            for (const queuedImage of nonGatheredQueue.slice(0, getMaxRequests(nonGatheredQueue))) {
                if (cancelled.value) break;
                if (queuedImage.waitData?.done) continue;

                const t0 = performance.now() / 1000;

                if (!queuedImage.jobId) {
                    const resJSON = await fetchNewID(queuedImage);
                    if (!resJSON) return generationFailed();
                    queuedImage.jobId = resJSON.id as string;
                }
    
                const status = await checkImage(queuedImage.jobId);
                if (!status) return generationFailed();
                if (status.faulted) return generationFailed("Failed to generate: Generation faulted.");
                if (status.is_possible === false) return generationFailed("Failed to generate: Generation not possible.");
                queuedImage.waitData = status;
    
                if (status.done) {
                    const finalImages = await getImageStatus(queuedImage.jobId);
                    if (!finalImages) return generationFailed();
                    processImages(finalImages.map(image => ({...image, ...queuedImage})))
                        .then(() => queuedImage.gathered = true);
                }
                
                await sleep(500);
                const t1 = performance.now() / 1000;
                secondsElapsed += t1 - t0;

                uiStore.updateProgress(queueStatus.value, secondsElapsed);
            }
            if (DEBUG_MODE) console.log("Checked all images:", queueStatus.value);
        }

        if (DEBUG_MODE) console.log("Images done/cancelled");

        if (cancelled.value) {
            // Retrieve final images that were cancelled
            for (const queuedImage of queue.value) {
                if (queuedImage.gathered || queuedImage.jobId === "") continue;
                const finalImages = cancelled.value ? await cancelImage(queuedImage.jobId) : await getImageStatus(queuedImage.jobId);
                if (!finalImages) return generationFailed();
                if (finalImages.length === 0) continue;
                await processImages(finalImages.map(image => ({...image, ...queuedImage})));
            }
            if (DEBUG_MODE) console.log("Got cancelled images");
        }

        return generationDone();
    }

    function mergeObjects(data: any[]) {
        return data.reduce((prev, curr) => {
            for (const [key, value] of Object.entries(curr)) {
                if (typeof value === "boolean") {
                    if (prev[key] === undefined) prev[key] = value;
                    prev[key] = prev[key] && value;
                    continue;
                }
                if (!prev[key]) prev[key] = 0;
                prev[key] += value;
            }
            return prev;
        }, {});
    }

    /**
     * Called when an image has failed.
     * @returns []
     */
    async function generationFailed(error?: string) {
        const store = useUIStore();
        if (error) store.raiseError(error, false);
        generating.value = false;
        cancelled.value = false;
        store.progress = 0;
        for (const { jobId } of queue.value) {
            await cancelImage(jobId);
        }
        queue.value = [];
        return [];
    }

    function validateParam(paramName: string, param: number, max: number, defaultValue: number) {
        if (param <= max) return param;
        useUIStore().raiseWarning(`This image was generated using the 'Larger Values' option. Setting '${paramName}' to its default value instead of ${param}.`, true)
        return defaultValue;
    }

    /**
     * Prepare an image for going through text2img on the Horde
     * */ 
    function generateText2Img(data: ImageData, correctDimensions = true) {
        const defaults = getDefaultStore();
        generatorType.value = "Text2Img";
        multiModelSelect.value = "Disabled";
        router.push("/");
        if (correctDimensions) {
            const calculateNewDimensions = (value: number) => data.post_processing?.includes("RealESRGAN_x4plus") ? value / 4 : value;
            data.width = calculateNewDimensions(data.width || defaults.width as number);
            data.height = calculateNewDimensions(data.height || defaults.height as number);
        }
        if (data.prompt) {
            const splitPrompt = data.prompt.split(" ### ");
            prompt.value = splitPrompt[0];
            negativePrompt.value = splitPrompt[1] || "";
        }
        if (data.sampler_name)    params.value.sampler_name = data.sampler_name;
        if (data.steps)           params.value.steps = validateParam("steps", data.steps, maxSteps.value, defaults.steps as number);
        if (data.cfg_scale)       params.value.cfg_scale = data.cfg_scale;
        if (data.clip_skip)       params.value.clip_skip = data.clip_skip;
        if (data.width)           params.value.width = validateParam("width", data.width, maxDimensions.value, defaults.width as number);
        if (data.height)          params.value.height = validateParam("height", data.height, maxDimensions.value, defaults.height as number);
        if (data.seed)            params.value.seed = data.seed;
        if (data.karras)          params.value.karras = data.karras;
        if (data.post_processing) params.value.post_processing = data.post_processing as typeof availablePostProcessors;
        if (data.modelName)       selectedModel.value = data.modelName;
        if (data.hires_fix)       params.value.hires_fix = data.hires_fix
    }

    /**
     * Prepare an image for going through img2img on the Horde
     * */ 
    function generateImg2Img(sourceimg: string) {
        const canvasStore = useCanvasStore();
        generatorType.value = "Img2Img";
        img2img.value.sourceImage = sourceimg;
        canvasStore.drawing = false;
        images.value = [];
        router.push("/");
        fabric.Image.fromURL(sourceimg, canvasStore.newImage);
        // Note: unused code
        // const img = new Image();
        // img.onload = function() {
        //     uploadDimensions.value = `${(this as any).naturalWidth}x${(this as any).naturalHeight}`;
        // }
        // img.src = newImgUrl;
    }

    /**
     * Prepare an image for going through inpainting on the Horde
     * */ 
    function generateInpainting(sourceimg: string) {
        const canvasStore = useCanvasStore();
        images.value = [];
        inpainting.value.sourceImage = sourceimg;
        generatorType.value = "Inpainting";
        router.push("/");
        fabric.Image.fromURL(sourceimg, canvasStore.newImage);
    }

    /**
     * Combines positive and negative prompt
     */
    function getFullPrompt() {
        if (negativePrompt.value === "") return prompt.value;
        return `${prompt.value} ### ${negativePrompt.value}`;
    }

    /**
     * Returns all prompt matrix combinations
     */
    function promptMatrix() {
        const prompt = getFullPrompt();
        const matrixMatches = prompt.match(/\{(.*?)\}/g) || [];
        if (matrixMatches.length === 0) return [prompt];
        let prompts: string[] = [];
        matrixMatches.forEach(matrix => {
            const newPrompts: string[] = [];
            const options = matrix.replace("{", "").replace("}", "").split("|");
            if (prompts.length === 0) {
                options.forEach(option => {
                    const newPrompt = prompt.replace(matrix, option);
                    newPrompts.push(newPrompt);
                });
            } else {
                prompts.forEach(previousPrompt => {
                    options.forEach(option => {
                        const newPrompt = previousPrompt.replace(matrix, option);
                        newPrompts.push(newPrompt);
                    });
                });
            }
            prompts = [...newPrompts];
        });
        return prompts;
    }

    function addDreamboothTrigger(trigger?: string) {
        if (!selectedModelData.value?.trigger) return;
        if (prompt.value.includes((trigger || selectedModelData.value.trigger[0]))) return;
        prompt.value = (trigger || selectedModelData.value.trigger[0]) + ", " + prompt.value;
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: GenerationInput) {
        if (DEBUG_MODE) console.log("New Generation: ", parameters)
        const optionsStore = useOptionsStore();
        const response: Response = await fetch(`${BASE_URL_STABLE}/api/v2/generate/async`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': optionsStore.apiKey,
            },
            body: JSON.stringify(parameters)
        })
        const resJSON: RequestAsync = await response.json();
        if (!validateResponse(response, resJSON, 202, "Failed to fetch ID", onInvalidResponse)) return false;
        return resJSON;
    }

    /**
     * Called when a generation is finished.
     * */ 
    async function processImages(finalImages: (GenerationStable & ICurrentGeneration)[]) {
        const store = useOutputStore();
        const optionsStore = useOptionsStore();
        const finalParams: ImageData[] = await Promise.all(
            finalImages.map(async (image) => {
                let { img } = image;
                if (image.r2) {
                    const res = await fetch(`${img}`);
                    const blob = await res.blob();
                    const base64 = await convertToBase64(blob) as string;
                    img = base64.split(",")[1];
                    gatheredImages.value++;
                }
                const { params } = image;
                return {
                    // The database automatically increments IDs for us
                    id: -1,
                    jobId: image.jobId,
                    image: `data:image/webp;base64,${img}`,
                    hordeImageId: image.id,
                    sharedExternally: optionsStore.shareWithLaion === "Enabled" || optionsStore.apiKey === '0000000000',
                    prompt: image.prompt,
                    modelName: image.model,
                    workerID: image.worker_id,
                    workerName: image.worker_name,
                    seed: image.seed,
                    steps: params?.steps,
                    sampler_name: params?.sampler_name,
                    width: (params?.width as number) * ((params?.post_processing || []).includes("RealESRGAN_x4plus") ? 4 : 1),
                    height: (params?.height as number) * ((params?.post_processing || []).includes("RealESRGAN_x4plus") ? 4 : 1),
                    cfg_scale: params?.cfg_scale,
                    clip_skip: params?.clip_skip,
                    karras: params?.karras,
                    hires_fix: params?.hires_fix,
                    post_processing: params?.post_processing,
                    tiling: params?.tiling,
                    starred: 0,
                    rated: 0,
                }
            })
        )
        images.value = [...images.value, ...await store.pushOutputs(finalParams) as ImageData[]];

        return finalParams;
    }

    /**
     * Called when a generation is finished.
     * */ 
    async function generationDone() {
        const uiStore = useUIStore();

        generating.value = false;
        cancelled.value = false;
        uiStore.progress = 0;
        uiStore.showGeneratedImages = true;
        queue.value = [];

        const onGeneratorPage = router.currentRoute.value.fullPath === "/";
        if ((onGeneratorPage && generatorType.value === "Rating") || !onGeneratorPage) {
            uiStore.showGeneratorBadge = true;
            const notification = ElNotification({
                title: 'Images Finished',
                message: h("div", [
                    'View your new images ',
                    h("span", {
                        style: {
                            color: "var(--el-menu-active-color)",
                            cursor: "pointer",
                        },
                        onClick: () => {
                            if (generatorType.value === "Rating") generatorType.value = "Text2Img";
                            uiStore.showGeneratorBadge = false;
                            router.push("/");
                            notification.close();
                        },
                    }, "here!"),
                ]),
                icon: h("img", {
                    src: images.value[0].image,
                    style: { maxHeight: "54px", maxWidth: "54px" },
                }),
                customClass: "image-notification",
            });
        }

        return images.value;
    }

    /**
     * Gets information about the generating image(s). Returns false if an error occurs.
     * */ 
    async function checkImage(imageID: string, tries: number = 0) {
        const response = await fetch(`${BASE_URL_STABLE}/api/v2/generate/check/`+imageID);
        
        if (response.status == 500) {
            tries++;
            if (tries < 5)
                return checkImage(imageID, tries);
        }

        const resJSON: RequestStatusCheck = await response.json();
        if (cancelled.value) return { wait_time: 0, done: false };
        if (!validateResponse(response, resJSON, 200, "Failed to check image status", onInvalidResponse)) return false;
        return resJSON;
    }

    /**
     * Cancels the generating image(s) and returns their state. Returns false if an error occurs.
     * */ 
    async function cancelImage(imageID: string) {
        queue.value = [];
        const response = await fetch(`${BASE_URL_STABLE}/api/v2/generate/status/`+imageID, {
            method: 'DELETE',
        });
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to cancel image", onInvalidResponse)) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    /**
     * Gets the final status of the generated image(s). Returns false if response is invalid.
     * */ 
    async function getImageStatus(imageID: string) {
        const response = await fetch(`${BASE_URL_STABLE}/api/v2/generate/status/`+imageID);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to check image status", onInvalidResponse)) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    function onInvalidResponse(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        uiStore.progress = 0;
        cancelled.value = false;
        images.value = [];
        return false;
    }

    /**
     * Updates available models
     * */ 
    async function updateAvailableModels() {
        const response = await fetch(`${BASE_URL_STABLE}/api/v2/status/models`);
        const resJSON: ActiveModel[] = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to get available models")) return;

        const dbResponse = await fetch(MODELS_DB_URL);
        const dbJSON = await dbResponse.json();
        const nameList = Object.keys(dbJSON);

        // Format model data
        const newStuff: IModelData[] = nameList.map(name => {
            const { description, style, nsfw, type, trigger, showcases } = dbJSON[name];
            const {
                queued = 0,
                eta = Infinity,
                count = 0,
                performance = 0,
            } = resJSON.find(el => el.name === name) || {};
          
            return {
                name,
                description,
                style,
                nsfw,
                type,
                trigger,
                showcases,
                queued,
                eta,
                count,
                performance,
            };
        });
        modelsData.value = newStuff;
        
        availableModelsGrouped.value = [];
        modelsData.value.forEach((model) => {
            if(
                nsfw.value == "Enabled" ||
                nsfw.value == "Censored" ||
                nsfw.value == "Disabled" && model.nsfw == false
                )
            {
                let restModel = resJSON.find(el => el.name == model.name);
                if (restModel != null)
                {
                    let modelStyle = availableModelsGrouped.value.find(el2 => el2.label == model.style);
                    if(modelStyle != null)
                        modelStyle.options.push({value: restModel.name as string, label: `${(model.nsfw == true?"[NSFW] ":"")}${restModel.name} (${restModel.count})`});
                    else
                    availableModelsGrouped.value.push({ label: model.style as string, options: [{value: restModel.name as string, label: `${(model.nsfw == true?"[NSFW] ":"")}${restModel.name} (${restModel.count})`}] })

                }
            }
        });

        availableModelsGrouped.value.push({ label: 'Extra', options: [{value: "Random!", label: "Random!"}, {value: "All Models!", label: "All Models!"}] });
    }

    async function updateStyles() {
        const response = await fetch(`https://raw.githubusercontent.com/db0/Stable-Horde-Styles/main/styles.json`);
        styles.value = await response.json();
    }

    function pushToNegativeLibrary(prompt: string) {
        if (negativePromptLibrary.value.indexOf(prompt) !== -1) return;
        negativePromptLibrary.value = [...negativePromptLibrary.value, prompt];
    }

    function removeFromNegativeLibrary(prompt: string) {
        negativePromptLibrary.value = negativePromptLibrary.value.filter(el => el != prompt);
    }

    function pushToPromptHistory(prompt: string) {
        if (promptHistory.value.findIndex(el => el.prompt === prompt) !== -1) return;
        if (promptHistory.value.length >= 10 + promptHistory.value.filter(el => el.starred).length) {
            const unstarredHistory = promptHistory.value.filter(el => !el.starred);
            const lastUnstarredIndex = promptHistory.value.findIndex(el => el === unstarredHistory[unstarredHistory.length - 1]);
            promptHistory.value.splice(lastUnstarredIndex, 1);
        }
        promptHistory.value = [
            ...promptHistory.value,
            {
                starred: false,
                timestamp: Date.now(),
                prompt,
            }
        ];
    }

    function removeFromPromptHistory(prompt: string) {
        //@ts-ignore
        promptHistory.value = promptHistory.value.filter(el => el.prompt != prompt && el != prompt);
    }

    /**
     * Generates a prompt (either creates a random one or extends the current prompt)
     * */
    function getPrompt()  {
        return false;
    }

    updateAvailableModels()
    updateStyles()
    setInterval(updateAvailableModels, POLL_MODELS_INTERVAL * 1000)
    setInterval(updateStyles, POLL_STYLES_INTERVAL * 1000)

    return {
        // Constants
        availablePostProcessors,
        availableControlType,
        // Variables
        generatorType,
        prompt,
        params,
        images,
        nsfw,
        trustedOnly,
        inpainting,
        img2img,
        uploadDimensions,
        cancelled,
        selectedModel,
        selectedModelMultiple,
        selectedControlTypeMultiple,
        multiModelSelect,
        multiControlTypeSelect,
        negativePrompt,
        generating,
        modelsData,
        negativePromptLibrary,
        minDimensions,
        maxDimensions,
        minImages,
        maxImages,
        minSteps,
        maxSteps,
        minCfgScale,
        maxCfgScale,
        minClipSkip,
        maxClipSkip,
        minDenoise,
        maxDenoise,
        queue,
        gatheredImages,
        promptHistory,
        styles,
        availableModelsGrouped,
        // Computed
        filteredAvailableModelsGrouped,
        kudosCost,
        canGenerate,
        modelDescription,
        queueStatus,
        selectedModelData,
        currentImageProps,
        totalImageCount,
        // Actions
        generateImage,
        generateText2Img,
        generateImg2Img,
        generateInpainting,
        getImageStatus,
        getPrompt,
        addDreamboothTrigger,
        checkImage,
        cancelImage,
        resetStore,
        pushToNegativeLibrary,
        removeFromNegativeLibrary,
        pushToPromptHistory,
        removeFromPromptHistory,
        generateFormBaseRules,
    };
});
