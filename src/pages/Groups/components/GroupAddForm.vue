<script setup lang="ts">
import BaseButton from '../../../components/ui/BaseButton.vue';
import { useGroupForm } from '../composables/useGroupForm';

const { newName, newCap, newSupport, addGroup } = useGroupForm();
</script>

<template>
	<form class="groups__form" @submit.prevent="addGroup">
		<input class="groups__input" v-model.trim="newName" placeholder="Название группы" required />
		<input
			class="groups__input groups__input--num"
			v-model.number="newCap"
			type="number"
			min="0"
			step="1"
			placeholder="Часы (емкость)"
			required
		/>
		<input
			class="groups__input groups__input--pct"
			v-model.number="newSupport"
			type="number"
			min="0"
			max="100"
			step="1"
			placeholder="% в поддержке"
			title="Процент ресурсов, уходящих на поддержку (0–100)"
		/>
		<BaseButton variant="primary" type="submit">Добавить</BaseButton>
	</form>
</template>
