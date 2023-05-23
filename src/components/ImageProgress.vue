<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { ElProgress, ElIcon } from 'element-plus';
import { Right } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const store = useGeneratorStore();
const uiStore = useUIStore();

const pendingRequests = computed(() => store.queue.filter(el => el.jobId === "" || !el.waitData));
</script>

<template>
    <div v-if="uiStore.progress != 0" style="text-align: center;">
        <el-progress
            type="circle"
            :percentage="uiStore.progress / (pendingRequests.length + 1)"
            :width="200"
        >
            <template #default>
                <span>{{lang.GetText(`progest`)}} {{ Math.round((store.queueStatus?.wait_time as number) * (pendingRequests.length + 1)) }}s</span><br>
            </template>
        </el-progress>
        <div style="font-size: 15px; padding: 8px; margin-top: 10px; background-color: var(--el-color-info-light-9); border-radius: 5px">
            <div style="font-size: 18px">{{lang.GetText(`proggenerationstatus`)}}</div>
            <span>{{lang.GetText(`progpending`)}} {{ (store.queueStatus.waiting || 0) + pendingRequests.map(el => el?.params?.n || 0).reduce((curr, next) => curr + next, 0) }} - </span>
            <span>{{lang.GetText(`progproccessing`)}} {{ store.queueStatus.processing }} - </span>
            <span>{{lang.GetText(`progfinished`)}} {{ store.queueStatus.finished }} - </span>
            <span>{{lang.GetText(`progrestarted`)}} {{ store.queueStatus.restarted }}</span>
            <div>{{lang.GetText(`progqueuepos`)}} {{ store.queueStatus.queue_position }}</div>
        </div>
        <div @click="uiStore.showGeneratedImages = true" v-if="store.images.length != 0" class="view-images">
            <span>{{lang.GetText(`progview`)}} {{ store.gatheredImages }} / {{ store.queue.map(el => el.params?.n || 0).reduce((curr, next) => curr + next, 0) }} {{lang.GetText(`progimages`)}}</span>
            <el-icon><Right /></el-icon>
        </div>
    </div>
</template>

<style scoped>
.view-images {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-info);
    font-weight: 500;
    margin-top: 8px;
    gap: 8px;
}

.view-images:hover {
    cursor: pointer;
    text-decoration: underline;
}
</style>