<script setup lang="ts">
import {
    ElCard,
    ElDivider,
    ElIcon,
    ElTooltip,
    ElCollapse,
    ElCollapseItem
} from 'element-plus';
import {
    VideoPause,
    CircleCheck,
    CircleClose,
    Warning
} from "@element-plus/icons-vue"
import type { WorkerDetailsStable } from '@/types/stable_horde';
import { computed } from 'vue';
import { formatSeconds } from '@/utils/format';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    worker: WorkerDetailsStable
}>();

const status = computed(() => {
    if (props.worker.online) {
        return lang.GetText(`workonline`);
    }
    if (props.worker.paused) {
        return lang.GetText(`workpaused`);
    }
    if (props.worker.maintenance_mode) {
        return lang.GetText(`workmaintenance`);
    }
    return lang.GetText(`workoffline`);
})
</script>

<template>
    <el-card class="worker-box">
        <template #header>
            <div style="display: flex; justify-content:space-between">
                <div class="card-header">
                    <el-tooltip
                        :content="status"
                        placement="top"
                    >
                        <el-icon :size="20" color="green"  v-if="worker.online"><CircleCheck /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="worker.paused"><VideoPause /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="worker.maintenance_mode"><Warning /></el-icon>
                        <el-icon :size="20" color="red"    v-else><CircleClose /></el-icon>
                    </el-tooltip>
                    <span style="margin-left: 0.5rem">{{worker.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
        </template>
        <div class="small-font">{{lang.GetText(`teamid`)}} {{worker.id}}</div>
        <div v-html="lang.GetText(`workhasrunfor`, {'%ONLINE%': (formatSeconds(worker.uptime, true, { days: true, hours: true, minutes: true }) || 0).toString()})"></div>
        <div v-html="lang.GetText(`workgenerated`, {'%CONT%': (worker.megapixelsteps_generated || 0).toString()})"></div>
        <div v-html="lang.GetText(`workspeed`, {'%SPEED%': (worker.performance?.split(' ')[0] || 0).toString()})"></div>
        <div v-html="lang.GetText(`workutilizing`, {'%THREADS%': (worker.threads || 0).toString()})"></div>
        <div v-html="lang.GetText(`workfulfilled`, {'%FULFILLED%': (worker.requests_fulfilled || 0).toString()})"></div>
        <div v-html="lang.GetText(`worknsfw`, {'%ISNSFW%': (worker.nsfw || false).toString()})"></div>
        <div v-html="lang.GetText(`workresolution`, {'%X%': (Math.floor(Math.sqrt(worker.max_pixels || 0))).toString(), '%Y%': (Math.floor(Math.sqrt(worker.max_pixels || 0))).toString()})"></div>
        <div>
            <el-collapse style="margin-top: 0.5rem; --el-collapse-header-height: 2.5rem">
                <el-collapse-item :title="lang.GetText('workmodels', {'%MODELS%': (worker.models?.length || 0).toString()})" name="1">
                    <strong>{{worker.models?.length === 0 ? "stable_diffusion" : ""}}</strong>
                    <strong v-for="(model, index) of worker.models" :key="index">
                        {{model}}{{index === worker.models?.length ? "" : ", "}}
                    </strong>
                </el-collapse-item>
            </el-collapse>
        </div>
        <el-divider v-if="worker.info" style="margin: 10px 0" />
        <div class="small-font">{{worker.info}}</div>
    </el-card>
</template>

<style scoped>
    .card-header {
        display: flex;
        align-items: center;
        font-weight: 800;
    }

    .small-font {
        font-style: oblique;
        font-size: 12px;
    }

    .worker-box {
        max-height: 100%;
    }
</style>