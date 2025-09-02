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
</script>

<style scoped lang="scss">
.app {
	&__main {
		max-width: 1100px;
		margin: 20px auto;
		padding: 0 16px;
	}
}
</style>
