<script setup lang="ts">
import {
    ElCard,
    ElDivider,
    ElIcon,
    ElCollapse,
    ElCollapseItem,
} from 'element-plus';
import { computed } from 'vue';
import CrownIcon from '../components/icons/CrownIcon.vue';
import CircleFilled from '../components/icons/CircleFilled.vue';
import type { TeamDetailsStable } from '../types/stable_horde';
import { formatSeconds } from '@/utils/format';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    team: TeamDetailsStable,
    top: boolean
}>();

const modelSorted = computed(() => [...props.team.models as any].sort((a, b) => b.count - a.count));
</script>

<template>
    <el-card class="team-box">
        <template #header>
            <div style="display: flex; justify-content:space-between">
                <div class="card-header">
                    <el-icon :size="20" color="var(--el-color-warning)" v-if="top" style="margin-right: 0.5rem"><CrownIcon /></el-icon>
                    <span>{{team.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
        </template>
        <div class="small-font">{{lang.GetText(`teamid`)}} {{team.id}}</div>
        <div>{{lang.GetText(`teamonlinefor`)}} <strong>{{formatSeconds(team.uptime, true, { days: true, hours: true, minutes: true })}}</strong></div>
        <div>{{lang.GetText(`teamgenerated`)}} <strong>{{team.contributions}}</strong> MPS</div>
        <div>{{lang.GetText(`teamspeed`)}} <strong>{{team.speed}}</strong> MPS/s</div>
        <div>{{lang.GetText(`teamfulfilled`)}} <strong>{{team.requests_fulfilled}}</strong> {{lang.GetText(`teamrequests`)}}</div>
        <el-collapse style="margin-top: 0.5rem">
            <el-collapse-item :title="lang.GetText(`teamworkers`)" name="1">
                <div v-if="team.worker_count === 0">{{lang.GetText(`teamnoworkers`)}}</div>
                <div v-else>
                    <div>{{lang.GetText(`teamtheyhave`)}} {{team.worker_count}} {{lang.GetText(`teamworkerss`)}}</div>
                    <ul class="remove-list-styling">
                        <li v-for="worker in team.workers" :key="worker.id">
                            <strong>
                                <el-icon :size="10" color="var(--el-color-success)" v-if="worker.online"><CircleFilled /></el-icon>
                                <el-icon :size="10" color="var(--el-color-danger)" v-else><CircleFilled /></el-icon>
                                <span style="margin-left: 5px">{{worker.name}}</span>
                            </strong>
                        </li>
                    </ul>
                </div>
            </el-collapse-item>
            <el-collapse-item :title="lang.GetText(`teammodels`)" name="2">
                <div v-if="team.models?.length === 0">{{lang.GetText(`teamnomodels`)}}</div>
                <div v-else>
                    <div>{{lang.GetText(`teamhostingmodels`)}}</div>
                    <ul class="remove-list-styling">
                        <li v-for="model in modelSorted" :key="model">
                            <strong>{{model.name}} ({{model.count}})</strong>
                        </li>
                    </ul>
                </div>
            </el-collapse-item>
        </el-collapse>
        <el-divider v-if="team.info" style="margin: 10px 0" />
        <div class="small-font">{{team.info}}</div>
    </el-card>
</template>

<style scoped>
    .card-header {
        display: flex;
        align-items: center;
        font-weight: 800;
    }

    .remove-list-styling {
        list-style-type: none;
        margin-top: 0;
    }

    .small-font {
        font-style: oblique;
        font-size: 12px;
    }

    .team-box {
        max-height: 100%;
    }
</style>