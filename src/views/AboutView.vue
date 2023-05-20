<script setup lang="ts">
import BaseLink from '@/components/BaseLink.vue';
import { useLanguageStore } from '@/stores/i18n';
const lang = useLanguageStore();
</script>

<template>
  <div class="about">
    <div class="about-content">
        {{lang.GetText(`abouttext1`)}}<br><br>
        {{lang.GetText(`abouttext2`)}} <BaseLink href="https://discord.gg/ugEqPP5wMT">Discord!</BaseLink><br><br>
        {{lang.GetText(`abouttext3`)}} <BaseLink :router="false" href="https://ko-fi.com/artificialart">Ko-Fi!</BaseLink>
        {{lang.GetText(`abouttext3b`)}}<br><br>
        <hr>
        {{lang.GetText(`abouttext4`)}} <BaseLink :router="false" href="https://aihorde.net/register">https://aihorde.net/register</BaseLink><br>
        <hr><br>
        {{lang.GetText(`abouttext5`)}} <BaseLink :router="false" href="https://icanhazdadjoke.com/">icanhazdadjoke.com</BaseLink><br><br>
        {{lang.GetText(`abouttext6`)}} <BaseLink :router="false" href="https://aqualxx.github.io/stable-ui/">aqualxx#5004</BaseLink><br><br>
        {{lang.GetText(`abouttext7`)}} <BaseLink :router="false" href="https://aihorde.net/">horde network</BaseLink> (<BaseLink :router="false" href="https://discord.gg/3DxrhksKzn">Discord</BaseLink>)<br>
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
