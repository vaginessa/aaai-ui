import { defineStore } from "pinia";
import { useColorMode, useLocalStorage } from '@vueuse/core'
import { ref, computed } from 'vue';
import { useWorkerStore } from '@/stores/workers';
import type { WorkerDetailsStable } from "@/types/stable_horde";


type IToggle = "Enabled" | "Disabled";
type IModeToggle = "Whitelist" | "Blacklist";
type IPictureType = "WEBP" | "PNG" | "JPG";

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", ref({
        colorMode: useColorMode({
            emitAuto: true,
            modes: {
              //contrast: 'dark contrast',
            },
        })
    }));
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

    // A janky way to fix using color modes
    options.value.colorMode = useColorMode({
        emitAuto: true,
        modes: {
          //contrast: 'dark contrast',
        },
        initialValue: options.value.colorMode
    }) as any

    function isWorkerWhitelisted(worker: WorkerDetailsStable) {
        return !useWorkers.value.find(element => worker.id == element)
    }

    function getListMode() {
        return workerListMode.value;
    }

    function addWorkerToSelection(worker: WorkerDetailsStable) {
        useWorkers.value.push(worker.id as string);
    }

    return {
        // Variables
        options,
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
