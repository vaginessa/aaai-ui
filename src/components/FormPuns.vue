<script setup lang="ts">
    import { validateResponse } from "@/utils/validate";
    import { ElEmpty } from 'element-plus';
    import { ref } from "vue";

    const getDadJoke = ref('No Data');
    
    async function getNewPun() {
        const response = await fetch("https://icanhazdadjoke.com/", {
            method: "GET",
            headers: {
                "User-Agent": "AAAI UI (https://github.com/SlayerTO/aaai-ui) DISCORD: Sgt. Chaos#0812",
                "Accept": "application/json"
            }
        });
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to get dad joke")) return false;
        getDadJoke.value = resJSON['joke'];
    }
</script>
<template>
    <el-empty v-on:vnode-before-mount="getNewPun();" :description="getDadJoke" />
</template>