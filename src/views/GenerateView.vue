<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    ElMenu
} from 'element-plus';
import {
    Comment,
    PictureFilled,
VideoCameraFilled
} from '@element-plus/icons-vue';

import FormRating from '../components/FormRating.vue';
import FormTxt2Img from '../components/FormTxt2Img.vue';
import FormImg2Img from '../components/FormImg2Img.vue';
import FormTxt2Vid from '../components/FormTxt2Vid.vue';
import FormImg2Vid from '../components/FormImg2Vid.vue';

import GeneratorMenuItem from '../components/GeneratorMenuItem.vue';
import StarEdit24Regular from '../components/icons/StarEdit24Regular.vue';

import { useUIStore } from '@/stores/ui';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import handleUrlParams from "@/router/handleUrlParams";
import { DEBUG_MODE, dots } from "@/constants";
import { useRatingStore } from '@/stores/rating';
import { useUserStore } from '@/stores/user';

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const userStore = useUserStore();
const uiStore = useUIStore();

function disableBadge() {
    if (store.generatorType !== "Rating") uiStore.showGeneratorBadge = false;
}

function onMenuChange(key: any) {
    if (key === "Img2Txt") return;
    if (key === "Txt2Txt") return;

    store.generatorType = key;
    disableBadge();
    if (DEBUG_MODE) console.log(key)
}

const ellipsis = setInterval(() => dots.value = dots.value.length >= 3 ? "" : ".".repeat(dots.value.length+1), 1000);

onUnmounted(() => {
    clearInterval(ellipsis);
})

disableBadge();
handleUrlParams();
</script>

<template>
    <el-menu
        :default-active="store.generatorType"
        :collapse="true"
        @select="onMenuChange"
        :mode="isMobile ? 'horizontal' : 'vertical'"
        :class="isMobile ? 'mobile-generator-types' : 'generator-types'"
    >
        <GeneratorMenuItem index="Txt2Img"       :icon-one="Comment"             :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Img2Img"       :icon-one="PictureFilled"       :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Txt2Vid"       :icon-one="Comment"             :icon-two="VideoCameraFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Img2Vid"       :icon-one="PictureFilled"       :icon-two="VideoCameraFilled" :isMobile="isMobile" />
        <!--GeneratorMenuItem index="Img2Txt"    :icon-one="PictureFilled"       :icon-two="Comment" :isMobile="isMobile" /-->
        <!--GeneratorMenuItem index="Txt2Txt"    :icon-one="Comment"             :icon-two="PictureFilled" :isMobile="isMobile" /-->
        <GeneratorMenuItem index="Rating"        :icon-one="StarEdit24Regular"   :isMobile="isMobile" />
    </el-menu>
    <div class="form">

        <FormTxt2Img v-if="store.generatorType === 'Txt2Img'" />
        <FormTxt2Vid v-if="store.generatorType === 'Txt2Vid'" />
        <FormImg2Vid v-if="store.generatorType === 'Img2Vid'" />
        <FormImg2Img v-if="store.generatorType === 'Img2Img'" />
        <FormRating v-if="store.generatorType === 'Rating'" />

    </div>
</template>

<style>
html body {
    height: calc(100% + 32px);
}

:root {
    --sidebar-width: 70px
}

:root .el-carousel {
    --el-carousel-arrow-background: rgba(31, 45, 61, 0.31);
    --el-carousel-arrow-hover-background: rgba(31, 45, 61, 0.51);
}

:root .el-carousel__arrow {
    border-radius: 0;
    height: 100%;
}

.small-btn {
    padding: 6px 8px;
    height: unset;
}

.generator-types {
    position: fixed;
    height: calc(100vh - 67px);
    top: 67px;
}

.mobile-generator-types {
    width: 100%
}

.generated-image {
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.generated-image > .el-card__body {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.el-collapse, .sidebar-container {
    width: 100%
}

.form {
    padding-left: 20px;
    margin-left: var(--sidebar-width);
}

.main {
    grid-area: main;
    display: flex;
    justify-content: center;
}

.sidebar {
    grid-area: sidebar;
    max-width: 90%;
}

.image {
    grid-area: image;
}

.container {
    display: grid;
    height: 75vh;
    grid-template-columns: 50% 50%;
    grid-template-rows: 40px 95%;
    grid-template-areas:
        "sidebar main"
        "sidebar image";
}

@media only screen and (max-width: 1280px) {
    html body {
        height: calc(100% + 75%);
    }

    .generated-image > .el-card__body {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .generated-image {
        width: 80%;
        height: 100%;
    }

    .container {
        display: grid;
        height: 110vh;
        grid-template-rows: minmax(400px, 45vh) 110px 60%;
        grid-template-columns: 100%;
        gap: 10px;
        grid-template-areas:
            "image"
            "main"
            "sidebar";
    }

    .sidebar {
        max-width: 100%;
    }
}

@media only screen and (max-width: 768px) {
    html body {
        height: calc(100% * 2);
    }

    .generated-image {
        width: 100%;
        height: 100%;
    }

    .container {
        grid-template-rows: minmax(400px, 50vh) 110px 60%;
    }

    .form {
        padding-top: 20px;
        padding-left: 0;
        margin-left: 0;
    }

    #app .el-menu.el-menu--horizontal.el-menu--collapse.mobile-generator-types .el-menu-item {
        width: 60px;
    }
}

</style>
