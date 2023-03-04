import type { DatasetImagePopResponse, RatePostInput, RatePostResponse } from "@/types/ratings";
import type { AestheticRating, GenerationSubmitted } from "@/types/stable_horde";
import { validateResponse } from "@/utils/validate";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useOptionsStore } from "./options";
import { useUIStore } from "./ui";
import { BASE_URL_STABLE } from "@/constants";
import { ElMessage } from 'element-plus';
import { delay } from "rxjs";

export const useRatingStore = defineStore("rating", () => {
    const currentRatingInfo = ref<DatasetImagePopResponse>({});
    const pendingRatingInfo = ref<DatasetImagePopResponse>({});
    const imagesRated = useLocalStorage<number>("ratedImages", 0);
    const kudosEarned = useLocalStorage<number>("ratedImagesKudos", 0);
    const submitted = ref(false);

    async function onInvalidResponse(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        submitted.value = false;
    }

    async function getNewRating() {
        const optionsStore = useOptionsStore();
        submitted.value = true;
        let response = await fetch("https://ratings.aihorde.net/api/v1/rating/new", {
            headers: {
                apikey: optionsStore.apiKey,
            }
        });

        let retryCount = 0;
        while(response.status != 200)
        {
            if(retryCount > 5) 
            {
                ElMessage({
                    message: `Unable to get new Horde Rating...`,
                    type: 'info',
                })
                return;
            }
            response = await fetch("https://ratings.aihorde.net/api/v1/rating/new", {
                headers: {
                    apikey: optionsStore.apiKey,
                }
            });
            retryCount++;
            delay(100);
        }

        const json: DatasetImagePopResponse = await response.json();

        let imgResponse = await fetch(json.url || "");
        
        let imageRetryCount = 0;
        while(imgResponse.status != 200)
        {
            if(imageRetryCount > 5) 
            {
                ElMessage({
                    message: `Unable to get new Horde Image...`,
                    type: 'info',
                })
                return;
            }
            imgResponse = await fetch(json.url || "");
            imageRetryCount++;
            delay(100);
        }

        if (!validateResponse(response, json, 200, "Failed to get rating", onInvalidResponse)) return;
        if (!validateResponse(imgResponse, json, 200, "Failed to get rating", onInvalidResponse)) return;
        submitted.value = false;
        return json;
    }

    async function baseSubmitRating(currentRating: RatePostInput, id: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch("https://ratings.aihorde.net/api/v1/rating/"+id, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": "AAAIUI:1.0:Discord Sgt. Chaos#0812",
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify(currentRating),
        });
        const json: RatePostResponse = await response.json();
        if (!validateResponse(response, json, 201, "Failed to submit rating", onInvalidResponse)) return;
        imagesRated.value = (imagesRated.value || 0) + 1;
        if (optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== '') kudosEarned.value = (kudosEarned.value || 0) + (json.reward || 5);
    }

    async function submitRatingHorde(currentRating: AestheticRating, jobId: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${BASE_URL_STABLE}/api/v2/generate/rate/`+jobId, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": "AAAIUI:1.0:Discord Sgt. Chaos#0812",
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify({
                ratings: [currentRating]
            }),
        });
        const json: GenerationSubmitted = await response.json();
        if (!validateResponse(response, json, 200, "Failed to submit rating", onInvalidResponse)) return;
        imagesRated.value = (imagesRated.value || 0) + 1;
        if (optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== '') kudosEarned.value = (kudosEarned.value || 0) + (json.reward || 5);
    }

    async function updateRatingInfo() {
        if (pendingRatingInfo.value.id) {
            currentRatingInfo.value = pendingRatingInfo.value;
        } else {
            getNewRating().then(ratingInfo => {
                currentRatingInfo.value = ratingInfo || {};
            })
        }
        getNewRating().then(ratingInfo => {
            pendingRatingInfo.value = ratingInfo || {};
        })
    }

    async function submitRating(currentRating: RatePostInput, id: string) {
        submitted.value = true;
        baseSubmitRating(currentRating, id);
        updateRatingInfo();
    }

    return {
        // Variables
        currentRatingInfo,
        imagesRated,
        kudosEarned,
        submitted,
        // Actions
        getNewRating,
        updateRatingInfo,
        baseSubmitRating,
        submitRating,
        submitRatingHorde,
    }
})