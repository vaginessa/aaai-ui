<script setup lang="ts">
import {
    ElFormItem,
    ElSelect,
    ElOptionGroup,
    ElOption
} from 'element-plus';
import FormLabel from './FormLabel.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label?: string;
    inline?: string;
    modelValue: any;
    prop: string;
    options: any[];
    multiple?: boolean;
    multiplelimit?: number;
    info?: string;
    filterable?: boolean;
    labelStyle?: string;
    placement?: string;
    change?: Function;
    grouping?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

function onChanged(value: any) {
    emit("update:modelValue", value);
    emit("change", value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-select v-if="grouping" :model-value="modelValue" :multiple-limit="multiplelimit" :filterable="filterable" :multiple="multiple" :placement="placement" @change="onChanged" placeholder="Select">
            <el-option-group
            v-for="group in options"
            :key="group.label"
            :label="group.label"
            >
                <el-option
                    v-for="item in group.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-option-group>
        </el-select>
        <el-select v-else :model-value="modelValue" :multiple-limit="multiplelimit" :filterable="filterable" :multiple="multiple" :placement="placement" @change="onChanged" placeholder="Select">
                <el-option
                    v-for="item in options"
                    :key="item"
                    :label="item.label !== undefined ? item.label : item"
                    :value="item.value !== undefined ? item.value : item"
                />
        </el-select>
        <slot name="inline"/>
    </el-form-item>
</template>