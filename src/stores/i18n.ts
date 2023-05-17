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
        "ttlength":"Sets the length of the entire video in seconds, so the number of AI generated frames will be FPS*Length."
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
