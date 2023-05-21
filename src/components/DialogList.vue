<script setup lang="ts">
import {
    ElButton,
    ElDialog,
    ElDivider,
    ElEmpty,
    ElInput
} from 'element-plus';
import {
    Search
} from '@element-plus/icons-vue';
import { ref, computed } from 'vue';

const props = defineProps<{
    modelValue: boolean;
    list: any[];
    title: string;
    emptyDescription: string;
    searchEmptyDescription: string;
    useText?: string;
    searchText?: string;
    deleteText?: string;
    width?: string;
}>();

const emit = defineEmits<{
    (e: 'use', prompt: string): void;
    (e: 'delete', prompt: string): void;
    (e: 'update:modelValue', value: boolean): void;
}>();

function handleClose() {
    emit('update:modelValue', false);
}

function handleUse(item: string) {
    emit('use', item);
    handleClose();
}

function handleDelete(item: string) {
    emit('delete', item)
}

const search = ref("");
const filteredList = computed(() => props.list.filter(el => el.includes(search.value)));
</script>

<template>
    <el-dialog :model-value="modelValue" @close="handleClose" :title="title" :width="width || '30%'" style="min-width: 370px;" center>
        
        <div class="options">
            <el-input v-model="search" style="width: 100%;" :suffix-icon="Search" :placeholder="searchText" />
            <slot name="options"></slot>
        </div>
        <el-empty v-if="list.length === 0" :description="emptyDescription" />
        <el-empty v-else-if="filteredList.length === 0" :description="searchEmptyDescription" />
        <div v-else>
            <ul style="list-style: none; padding: 0">
                <li v-for="item in filteredList" :key="item" class="list-item">
                    <slot name="item" :item="item">{{item}}</slot>
                    <div style="display: flex; justify-content:space-between;margin-top:10px;">
                        <slot name="actions" :item="item" :handleUse="handleUse" :handleDelete="handleDelete" :handleClose="handleClose">
                            <el-button class="small-btn" @click="() => handleUse(item)">{{ useText }}</el-button>
                            <el-button class="small-btn" type="danger" @click="() => handleDelete(item)" v-if="deleteText !== undefined">{{ deleteText }}</el-button>
                        </slot>
                    </div>
                </li>
            </ul>
        </div>
    </el-dialog>
</template>

<style scoped>
.options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.options > * {
    flex: 1 1 0px;
}

.list-item {
    background-color: #2d3338;
    border-radius: 5px;
    padding: 1rem;
    margin: 10px 0;
}
</style>