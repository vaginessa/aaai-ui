<script setup lang="ts">
import { ref } from "vue";
import { useRatingStore } from '@/stores/rating';
import { useUserStore } from "@/stores/user";
import RatingView from '../components/RatingView.vue';
import BaseLink from '../components/BaseLink.vue';
import {
    ElButton,
} from 'element-plus';


const ratingStore = useRatingStore();
const userStore = useUserStore();

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
        ratingStore.submitRating(ratingStore.currentRealRating, ratingStore.currentRatingInfo.id || "");
        ratingCycle.value = 0;
        ratingStore.currentRealRating = ratingStore.getDefaultRatings();
    }
});

userStore.updateRatingCount();

</script>

<template>
    <h1 style="margin: 0">Image Rating</h1>
    <div>Rate images based on aesthetics to gain kudos and help <BaseLink href="https://laion.ai/">LAION</BaseLink> - the non-profit who helped train Stable Diffusion - improve their datasets!</div>
    <div v-if="userStore.apiKey === '0000000000' || userStore.apiKey === ''">You have rated a total of <strong>{{ ratingStore.imagesRated }}</strong> images! <BaseLink router href="/options">Sign in</BaseLink> using your API key to start earning kudos.</div>
    <div v-else>From rating a total of <strong>{{ userStore.ratingCount }}</strong> images, you have gained <strong>{{ ratingStore.kudosEarned }}</strong> kudos!</div>
    <el-button
        @click="() => ratingStore.updateRatingInfo()"
        v-if="!ratingStore.currentRatingInfo.id"
        :disabled="ratingStore.submitted"
        style="margin-top: 10px"
        size="large"
    >{{ ratingStore.submitted ? "Loading image..." : "Start rating!"}}</el-button>
    <RatingView
        :id="ratingStore.currentRatingInfo.id || ''"
        :image-source="ratingStore.currentRatingInfo.url || ''"
        :submitted="ratingStore.submitted"
        @onRatingSubmit="ratingStore.submitRating"
    />
</template>
