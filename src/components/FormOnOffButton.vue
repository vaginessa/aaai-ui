<script setup lang="ts">
import type { Component } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    ElFormItem,
    ElButton
} from 'element-plus';
import FormLabel from './FormLabel.vue';
const store = useGeneratorStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    prop: string;
    label?: string;
    labelStyle?: string;
    modelValue: boolean | undefined;
    info?: string;
    disabled?: boolean;
    iconOn:Component<any>;
    iconOff:Component<any>;
}>();

const emit = defineEmits(["update:modelValue"]);

function onClicked(value: string | number | boolean) {
    emit("update:modelValue", value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-button v-if="modelValue === true && disabled !== true" :disabled="disabled" :icon="iconOn" :type="disabled === false ? 'success' : ''" @click="() => { onClicked(false); }" />
        <el-button v-else :icon="iconOff" :type="disabled === false ? '' : 'danger'" @click="() => { onClicked(true); }" />
        <slot name="inline" />
    </el-form-item>
</template>