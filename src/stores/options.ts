import { defineStore } from "pinia";
import { useLocalStorage } from '@vueuse/core'
import { ref, computed, watch, onMounted } from 'vue';
import { useWorkerStore } from '@/stores/workers';
import type { WorkerDetailsStable } from "@/types/stable_horde";


type IToggle = "Enabled" | "Disabled";
type IModeToggle = "Whitelist" | "Blacklist";
type IPictureType = "WEBP" | "PNG" | "JPG";

export const useOptionsStore = defineStore("options", () => {
    const pageSize = useLocalStorage("pageSize", 25);
    const pageless = useLocalStorage<IToggle>("pageless", "Disabled");
    const allowLargerParams = useLocalStorage<IToggle>("allowLargerParams", "Disabled");
    const shareWithLaion = useLocalStorage<IToggle>("shareWithLaion", "Disabled");
    const autoCarousel = useLocalStorage<IToggle>("autoCarousel", "Enabled");
    const zipMetaData = useLocalStorage<IToggle>("zipMetaData", "Enabled");
    const useBeta = useLocalStorage<IToggle>("useBeta", "Disabled");
    const useWorkers = useLocalStorage<string[]>("usedWorkers",[]);
    const workerListMode = useLocalStorage<IModeToggle>("workerListMode", "Whitelist"); 
    const pictureDownloadType = useLocalStorage<IPictureType>("downloadType", "JPG");

    const workerStore = useWorkerStore();

    const getWokersToUse = computed<string[]>(() => {
        var allowedWorkers: string[] = [];
        if (workerListMode.value === 'Whitelist') {
            useWorkers.value.forEach(el => {
                allowedWorkers.push(el);
            });
        } else {
            workerStore.workers.forEach(newWorker => {
                if(useWorkers.value.length == 0) return allowedWorkers;
                let include = true;
                useWorkers.value.forEach(exluded => {
                    if((newWorker.id || "") ==  exluded) {
                        include = false;
                        return;
                    }                    
                });
                if(include) {
                    allowedWorkers.push(newWorker.id || "");
                }
            });
        }
        return allowedWorkers;
    });

    function isWorkerWhitelisted(worker: WorkerDetailsStable) {
        return !useWorkers.value.find(element => worker.id == element)
    }

    function getListMode() {
        return workerListMode.value;
    }

    function addWorkerToSelection(worker: WorkerDetailsStable) {
        useWorkers.value.push(worker.id as string);
    }
    
    const colorMode = useLocalStorage("selectedColorMode", "dark");
    const lastColorMode = ref("");

    onMounted(refreshColorMode);

    function refreshColorMode()
    {
        if(lastColorMode.value == colorMode.value)
            return;

        if(lastColorMode.value != "") {
            if(colorMode.value == 'orange' || colorMode.value == 'green' || colorMode.value == 'purple')
                document.documentElement.classList.remove("dark");
            document.documentElement.classList.remove(lastColorMode.value);
        }

        if(colorMode.value == 'orange' || colorMode.value == 'green' || colorMode.value == 'purple')
            document.documentElement.classList.add("dark");
        document.documentElement.classList.add(colorMode.value);
        lastColorMode.value = colorMode.value;
    }

    watch(colorMode, () => {
        refreshColorMode()
    });

    return {
        // Variables
        colorMode,
        pageSize,
        pageless,
        allowLargerParams,
        autoCarousel,
        zipMetaData,
        useBeta,
        useWorkers,
        workerListMode,
        shareWithLaion,
        pictureDownloadType,
        // Computed
        getWokersToUse,
        // Actions
        isWorkerWhitelisted,
        getListMode,
        addWorkerToSelection
    };
});
