<template>
	<header class="header">
		<nav class="header__nav">
			<RouterLink class="header__link" to="/plan">Ресурсный план</RouterLink>
			<RouterLink class="header__link" to="/projects">Проекты</RouterLink>
			<RouterLink class="header__link" to="/groups">Группы ресурсов</RouterLink>
			<RouterLink class="header__link" to="/manage">Управление данными</RouterLink>
		</nav>
		<a
			v-if="helpUrl"
			:href="helpUrl"
			target="_blank"
			rel="noopener noreferrer"
			class="header__help"
			title="Справка"
		>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
				<path
					fill="currentColor"
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
				/>
			</svg>
		</a>
	</header>
</template>

<script setup lang="ts">
const helpUrl = import.meta.env.VITE_HELP_URL || '';
</script>

<style lang="scss" scoped>
.header {
	background: var(--blue-600);
	padding: 12px 16px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	&__nav {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}
	&__link {
		color: #fff;
		text-decoration: none;
		font-weight: 600;
		padding: 6px 10px;
		border-radius: 8px;
		&.router-link-active {
			background: var(--blue-700);
		}
	}
	&__help {
		color: #fff;
		opacity: 0.85;
		transition: opacity 0.15s;
		display: flex;
		align-items: center;
		padding: 6px;
		border-radius: 8px;
		&:hover {
			opacity: 1;
			background: var(--blue-700);
		}
	}
}
</style>
