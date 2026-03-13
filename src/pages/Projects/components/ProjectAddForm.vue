<script setup lang="ts">
import BaseButton from '../../../components/ui/BaseButton.vue';
import { useProjectForm } from '../composables/useProjectForm';

const { newName, newUrl, newCustomer, newProjectManager, newProjectType, newDescription, addProject } =
	useProjectForm();
</script>

<template>
	<form class="projects__form" @submit.prevent="addProject">
		<input class="projects__input" v-model.trim="newName" placeholder="Название проекта" required />
		<input class="projects__input projects__input--url" v-model.trim="newUrl" placeholder="Ссылка" type="url" />
		<input class="projects__input" v-model.trim="newCustomer" placeholder="Заказчик" />
		<input class="projects__input" v-model.trim="newProjectManager" placeholder="Руководитель проекта" />
		<input class="projects__input" v-model.trim="newProjectType" placeholder="Тип проекта" />
		<input class="projects__input" v-model.trim="newDescription" placeholder="Описание" />
		<BaseButton variant="primary" type="submit">Добавить</BaseButton>
	</form>
</template>
