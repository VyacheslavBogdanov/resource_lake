<template>
	<header class="header">
		<nav class="header__nav">
			<RouterLink class="header__link" to="/plan">Ресурсный план</RouterLink>
			<RouterLink class="header__link" to="/projects">Проекты</RouterLink>
			<RouterLink class="header__link" to="/groups">Группы ресурсов</RouterLink>
			<RouterLink class="header__link" to="/manage">Управление данными</RouterLink>
		</nav>
	</header>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.header {
	background: var(--blue-600);
	padding: 12px 16px;
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
}
</style>
