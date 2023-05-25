<script setup lang="ts">
import { RouterView } from "vue-router";
import { useLanguageStore } from "./stores/i18n";

const langStore = useLanguageStore();
if(langStore.currentLanguage == "None") {
    var userLang = navigator.language;
    langStore.currentLanguage = userLang.slice(0,2);
}

</script>

<template>
    <router-view />
</template>