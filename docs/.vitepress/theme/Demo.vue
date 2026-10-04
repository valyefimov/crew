<script setup lang="ts">
import { withBase } from "vitepress";

/** Demo video with voice-over; `lang` picks the narration track. */
const props = defineProps<{ lang?: "en" | "ru" | "uk" }>();
const src = withBase(`/media/demo${props.lang && props.lang !== "en" ? `-${props.lang}` : ""}.mp4`);
</script>

<template>
  <div class="crew-demo">
    <video :src="src" :poster="withBase('/media/poster.png')" controls playsinline preload="metadata" />
  </div>
</template>

<style scoped>
.crew-demo {
  margin: 24px 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 30px 80px -20px rgba(139, 92, 246, 0.35);
}
.crew-demo video {
  display: block;
  width: 100%;
}
</style>
