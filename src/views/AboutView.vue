<script setup lang="ts">
import BaseLink from '@/components/BaseLink.vue';
</script>

<template>
  <div class="about">
    <div class="about-content">
        <h1 style="margin-top: 0;margin-bottom: 15px;">About</h1>
        <div>This tool provides a front-end for generating free Stable Diffusion images without needing any special hard- or software!</div><br>
        <div>If you are looking do a place to chill out, share your latest art work, discuss with other likeminded individuals, herer you go join our <BaseLink href="https://discord.gg/ugEqPP5wMT">Discord</BaseLink> (we even got all kinds of <strong>cats</strong>!).</div><br>
        <div>If you want to support this endover you can head over to <BaseLink :router="false" href="https://ko-fi.com/artificialart">Ko-Fi</BaseLink> and show us some love.</div><br>
        <hr>
        <div>If you are in need of an API-Key you can get one over at <BaseLink :router="false" href="https://stablehorde.net/register">https://stablehorde.net/register</BaseLink></div>
        <hr>
        <div><br/>Based on the original development by <BaseLink :router="false" href="https://aqualxx.github.io/stable-ui/">aqualxx#5004</BaseLink></div>
        <div><br/>Powerd by <BaseLink :router="false" href="https://stablehorde.net/">horde network</BaseLink></div>
    </div>
  </div>
</template>

<style scoped>
h3, h1 {
    margin-bottom: 0;
}

.about {
    width: 100%;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
}

.about-content {
    width: 60%
}

@media only screen and (max-width: 1000px) {
    .about-content {
        width: 80%;
    }
}

@media only screen and (max-width: 700px) {
    .about-content {
        width: 100%;
    }
}
</style>
