import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useLanguageStore = defineStore("i18n", () => {

    const currentLanguage = ref("en");
    const english = ref("en");

    const ENDirectory:{[key: string]: string} = {
        "ttsampler":"k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast.",
        "ttsteps":"Keep step count between 20-30 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed.",
        "ttcfg":"Higher values will make the AI respect your prompt more, but might need higher step count. Lower values allow the AI to be more creative.",
        "ttclipskip":"How many iterations will be skipped while parsing the CLIP model.",
        "ttpostprocessor":"GPFGAN and Codeformers Improves faces, RealESRGAN, NMKD, AnimeSharp: Upscalers, strip_background removes the background.",
        "tttiling":"CURRENTLY OFFLINE ON COMFYUI! Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/",
        "ttkarras":"Improves image generation while requiring fewer steps. Mostly magic!",
        "tthiresfix":"Starts generating in lower resolution to avoid morphing, then upscales and fills in the image with details.",
        "tttrustedworker":"Only let trusted workers process your requests, might result in longer queues.",
        "ttnsfw":"Shows models on the list that were flagged as NSFW. Not needed to generate NSFW content.",
        "ttcensornsfw":"If nsfw material this toggle will censor them. Overly sensitive!",
        "ttslowworker":"When True, allows slower workers to pick up this request. Disabling this incurs an extra kudos cost.",
        "ttreplacementfilter" :"If enabled, words that might generate unethical content are automatically replaced. If you disable it, and prompt unethical things, exepct long timeouts!",
        "ttdenoise":"The final image will diverge more from the starting image at higher values.",
        "ttboomerang":"Zoom In and Out. After the inital move, reverse back to the begining.",
        "ttautozoom":"Tries to generate the most intresting Zoom.",
        "ttinterpolate":"Interpolation between frames will make the animation look smoother without having to render out too many frames.",
        "ttlength":"Sets the length of the entire video in seconds, so the number of AI generated frames will be FPS*Length.",

        "ttlargervalues":"Allows use of larger step values and dimension sizes if you have the kudos on hand.",
        "ttsharelaion":"Automatically and anonymously share images with LAION (the non-profit that created the dataset that was used to train Stable Diffusion) for use in aesthetic training in order to improve future models. See the announcement at https://discord.com/channels/781145214752129095/1020707945694101564/1061980573096226826 for more information. NOTE: This option is automatically enabled for users without a valid API key. ",
        "ttmetadata":"Downloads or Zips a JSON file with generation settings to every images.",


        "engapikey":"API Key",
        "engenterapikey":"Enter your API key here",

        "lllargervalues":"Larger Values",
        "llsharelaion":"Share Generated Images with LAION",
        "llimagesperpage":"Images Per Page",
        "llpageless":"Pageless Format",
        "llcarouselauto":"Carousel Auto Cycle",
        "llfileformat":"Download Fileformat",
        "llmetadata":"Download Meta Data",
        "llexportzip":"Export Images (ZIP File)",
        "llimportzip":"Import Images (ZIP File)",
        "llcolormode":"Color Mode:",

        "abouttext1":"This tool provides a front-end to generate images with Stable Diffusion for free! No downloads, expensive hardware, or additional softwares are needed. We are bringing you all the latest tools in a simple, compact, and easy to understand package! Currently supporting 200+ models to cover all your realistic, artistic, anime, cartoon or other needs, with new ones being added almost every day.",
        "abouttext2":"Looking for a place to share your art, ask questions, or have a chat with likeminded individuals? Join our ",
        "abouttext3":"If you want to show some love and support this project, head over to ",
        "abouttext3b":"Every donation helps us to maintain the UI, cover infrastructure costs, and potentially hire more programmers to make your experience even better!",
        "abouttext4":"If you are in need of an API-Key you can get one at ",
        "abouttext5":"DadJokes by ",
        "abouttext6":"Based on the stableUI, developed by ",
        "abouttext7":"Powerd by the ",

    }

    function GetText(name: string) {
        name = name.replace(/[^0-9a-z]/gi, '')
        if(currentLanguage.value == english.value)
            return ENDirectory[name]
        else
            return "Missing Language: " + currentLanguage.value
    }

    return {
        GetText
    }
});
