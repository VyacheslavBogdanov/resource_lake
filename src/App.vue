<template>
	<div class="app">
		<NavHeader />
		<main class="app__main">
			<RouterView />
		</main>
	</div>
</template>

<script setup lang="ts">
import NavHeader from './components/NavHeader.vue';
import { onMounted } from 'vue';
import { fetchAllData } from './composables/useInitialFetch';

onMounted(() => fetchAllData());
</script>

<style scoped lang="scss">
.app {
	&__main {
		display: inline;
		max-width: 1100px;
		margin: 50px auto;
		padding: 0 20px;
	}
}
</style>
