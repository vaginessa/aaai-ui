<script setup lang="ts">
import type { RatePostInput } from '@/types/ratings';
import {
    ElButton,
    vLoading,
    ElRate,
    ElImage
} from 'element-plus';
import { ref } from 'vue';

const props = defineProps<{
    id: string;
    imageSource?: string;
    submitted: boolean;
    iconSize?: string;
}>();

const emit = defineEmits<{
    (e: 'onRatingSubmit', rating: RatePostInput, id: string): void;
}>();

const artifactDescriptions = [
    null,
    "Complete Mess",
    "Serious Issues",
    "Minor Issues",
    "Noticeable Flaws",
    "Small Errors",
    "Flawless",
]

const imageDescriptions = [
    null,
    'The Worst!',
    'Terrible',
    'Very Bad',
    'Rather Bad',
    'OK',
    'Not Bad',
    'Rather Good',
    'Very Good',
    'Excellent',
    'The Best!',
]

const getDefaultRatings = () => ({
    rating: 5,
    artifacts: 6,
})

const currentRating = ref(getDefaultRatings());
const showImage = ref(false);

function onRatingSubmit() {
    emit(
        "onRatingSubmit",
        {
            ...currentRating.value,
            artifacts: 6 - currentRating.value.artifacts,
        }, 
        props.id,
    );
    currentRating.value = getDefaultRatings();
    showImage.value = false;
}
const colors10 = ref({1:'#7B0100', 2:'#EA0001', 4:'#FA9924', 6:'#FEC923', 8:'#92D14F', 10:'#00602B'});
const colors6 = ref({1:'#7B0100', 2:'#EA0001', 3:'#FA9924', 4:'#FEC923', 5:'#92D14F', 6:'#00602B'});
</script>

<template>
    <div v-if="id" class="rate">
        <div v-if="imageSource">
            <el-image v-loading="!showImage" @load="() => showImage = true" :src="imageSource" class="rate-image" />
        </div>
        <div>
            <div>How would <em><strong>you</strong></em> rate this image? ({{ imageDescriptions[currentRating.rating || 1] }})</div>
            <el-rate :max="10" v-model="currentRating.rating" :colors="colors10"/>
            <div><span class="starLike">1</span><span class="starLike">2</span><span class="starLike">3</span><span class="starLike">4</span><span class="starLike">5</span><span class="starLike">6</span><span class="starLike">7</span><span class="starLike">8</span><span class="starLike">9</span><span class="starLike">10</span></div>
        </div>
        <div>
            <div>How would <em><strong>you</strong></em> describe the flaws, artifacts, etc? ({{ artifactDescriptions[currentRating.artifacts || 1] }})</div>
            <el-rate :max="6" v-model="currentRating.artifacts" :colors="colors6"/>
            <div><span class="starLike">1</span><span class="starLike">2</span><span class="starLike">3</span><span class="starLike">4</span><span class="starLike">5</span><span class="starLike">6</span></div>
        </div>
        <div><el-button style="height: 50px; width: 200px; margin-bottom: 75px;" @click="() => onRatingSubmit()" :disabled="submitted">Submit rating</el-button></div>
    </div>
</template>

<style scoped>
.rate {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.starLike {
    width:28px;
    display: inline-block;
    margin-right: 6px;
}

.rate-image {
    box-shadow: 7px 7px 15px #000;
    border-radius: 3px;
}

:deep(.el-rate__icon) {
    font-size: v-bind("iconSize || '28px'") !important;
}

:deep(.el-image__inner) {
    object-fit: contain;
    width: 100%;
    max-width: 80vh;
    height: auto;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

:deep(.el-image__wrapper) {
    text-align:center;
}
</style>