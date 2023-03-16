<script setup lang="ts">
import { useRatingStore } from '@/stores/rating';
import type { RatePostInput } from '@/types/ratings';
import {
    ElButton,
    vLoading,
    ElRate,
    ElImage
} from 'element-plus';
import { ref } from 'vue';
const ratingStore = useRatingStore();

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

const showImage = ref(false);

function onRatingSubmit() {
    
    let rp:RatePostInput = {
        rating: ratingStore.currentRealRating.rating,
        artifacts: 6 - ratingStore.currentRealRating.artifacts,
    };

    emit("onRatingSubmit",rp,props.id);
    ratingStore.currentRealRating = ratingStore.getDefaultRatings();
    showImage.value = false;
    ratingCycle.value = 0;
}

const colors10 = ref({1:'#7B0100', 2:'#EA0001', 4:'#FA9924', 6:'#FEC923', 8:'#92D14F', 10:'#00602B'});
const colors6 = ref({1:'#7B0100', 2:'#EA0001', 3:'#FA9924', 4:'#FEC923', 5:'#92D14F', 6:'#00602B'});

const ratingCycle = ref(0);

window.addEventListener('keyup', (event) => {

    let rating = 0;
    if (event.key == "1") {
        rating = 1;
    } else if (event.key == "2") {
        rating = 2;
    } else if (event.key == "3") {
        rating = 3;
    } else if (event.key == "4") {
        rating = 4;
    } else if (event.key == "5") {
        rating = 5;
    } else if (event.key == "6") {
        rating = 6;
    } else if (event.key == "7" && ratingCycle.value == 0) {
        rating = 7;
    } else if (event.key == "8" && ratingCycle.value == 0) {
        rating = 8;
    } else if (event.key == "9" && ratingCycle.value == 0) {
        rating = 9;
    } else if (event.key == "0" && ratingCycle.value == 0) {
        rating = 10;
    } else if ((event.key == "Enter" || event.key == " ") && ratingCycle.value > 1) {
        rating = -1;
    } else {
        return;
    }

    if (ratingCycle.value == 0) {
        ratingStore.currentRealRating.rating = rating;
        ratingCycle.value++;
    } else if (ratingCycle.value == 1) {
        ratingStore.currentRealRating.artifacts = rating;
        ratingCycle.value++;
    } else if (rating == -1 && ratingCycle.value > 1) {
        onRatingSubmit();
    }
});

</script>

<template>
    <div v-if="id" class="rate">
        <div v-if="imageSource">
            <el-image v-loading="!showImage" @load="() => showImage = true" :src="imageSource" class="rate-image" />
        </div>
        <div>
            <div>How would <em><strong>you</strong></em> rate this image? ({{ imageDescriptions[ratingStore.currentRealRating.rating || 1] }})</div>
            <el-rate :max="10" v-model="ratingStore.currentRealRating.rating" :colors="colors10"/>
            <div><span class="starLike">1</span><span class="starLike">2</span><span class="starLike">3</span><span class="starLike">4</span><span class="starLike">5</span><span class="starLike">6</span><span class="starLike">7</span><span class="starLike">8</span><span class="starLike">9</span><span class="starLike">10</span></div>
        </div>
        <div>
            <div>How would <em><strong>you</strong></em> describe the flaws, artifacts, etc? ({{ artifactDescriptions[ratingStore.currentRealRating.artifacts || 1] }})</div>
            <el-rate :max="6" v-model="ratingStore.currentRealRating.artifacts" :colors="colors6"/>
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