import { defineStore } from "pinia";
import { ref } from "vue";

"aaai" | "danbooru" | "e621"

export const useTagsStore = defineStore("tags", () => {
    
    const selectedModels = ref<IModelData[]>(["aaai", "danbooru", "e621"]);

    async function getSuggestionList() 
    {
        const models = "";
        selectedModels.value
        const url = `https://api.artificial-art.eu/tags/query?u=${userId.value}&t=`;
        const response = await fetch(url);
        const resJSON = await response.json();
    }
    

    return {
    };
});