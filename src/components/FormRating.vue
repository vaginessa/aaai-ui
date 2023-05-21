<script setup lang="ts">
import { ref } from "vue";
import { useRatingStore } from '@/stores/rating';
import { useUserStore } from "@/stores/user";
import RatingView from '../components/RatingView.vue';
import BaseLink from '../components/BaseLink.vue';
import {
    ElButton,
} from 'element-plus';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
const ratingStore = useRatingStore();
const userStore = useUserStore();

userStore.updateRatingCount();

</script>

<template>
    <h1 style="margin: 0">{{lang.GetText(`ratingtitle`)}}</h1>
    <div>{{lang.GetText(`ratingtext1`)}} <BaseLink href="https://laion.ai/">LAION</BaseLink>{{lang.GetText(`ratingtext2`)}}</div>
    <div v-if="userStore.apiKey === '0000000000' || userStore.apiKey === ''">{{lang.GetText(`ratingtext3`)}}<strong>{{ ratingStore.imagesRated }}</strong> ! <BaseLink router href="/options">{{lang.GetText(`llsignin`)}}</BaseLink>{{lang.GetText(`ratingtext4`)}}</div>
    <div v-else>{{lang.GetText(`ratingtext5`)}} <strong>{{ userStore.ratingCount }}</strong>{{lang.GetText(`ratingtext6`)}}<strong>{{ userStore.ratingKudos }}</strong> kudos!</div>
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
