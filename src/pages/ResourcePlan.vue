<template>
	<section class="plan">
		<h1 class="plan__title">Ресурсный план</h1>

		<div class="plan__table-wrapper" v-if="store.projects.length && store.groups.length">
			<table class="plan__table">
				<thead>
					<tr>
						<th class="plan__th plan__th--sticky">Проект</th>
						<th
							v-for="g in store.groups"
							:key="g.id"
							class="plan__th"
							:class="{
								'plan__th--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
						>
							<div class="plan__th-text">
								<span>{{ g.name }}</span>
								<small class="plan__capacity">ёмкость: {{ g.capacityHours }}</small>
							</div>
						</th>
						<th class="plan__th plan__th--total">Итого (по проекту)</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="p in store.projects"
						:key="p.id"
						class="plan__row"
						:class="{ 'plan__row--archived': p.archived }"
					>
						<th class="plan__sticky">{{ p.name }}</th>
						<td
							v-for="g in store.groups"
							:key="g.id"
							class="plan__cell"
							:class="{
								'plan__cell--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
						>
							{{ store.valueByPair(p.id, g.id) }}
						</td>
						<td class="plan__cell plan__cell--total">
							{{ store.rowTotalByProject(p.id) }}
						</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<th class="plan__th plan__th--sticky">Итого (по группе)</th>
						<td
							v-for="g in store.groups"
							:key="g.id"
							class="plan__cell plan__cell--footer"
							:class="{
								'plan__cell--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
						>
							{{ store.colTotals[g.id] || 0 }}
						</td>
						<td class="plan__cell plan__cell--total">{{ store.grandTotal }}</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<p v-else class="plan__empty">Добавьте проекты и группы ресурсов, чтобы увидеть план.</p>
	</section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useResourceStore } from '../stores/resource';
const store = useResourceStore();
onMounted(() => store.fetchAll());
</script>

<style scoped lang="scss">
.plan {
	&__title {
		margin-bottom: 16px;
	}
	&__table-wrapper {
		overflow-x: auto;
		background: #fff;
		border-radius: 12px;
		box-shadow: var(--shadow);
	}
	&__table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}
	&__th,
	&__cell {
		padding: 10px 12px;
		text-align: right;
		border-bottom: 1px solid #e9eef6;
	}
	&__th--sticky,
	&__sticky {
		position: sticky;
		left: 0;
		background: #f8fbff;
		text-align: left;
	}
	&__th--total,
	&__cell--total {
		font-weight: 700;
		background: #f3f7ff;
	}
	&__cell--footer {
		font-weight: 600;
	}
	&__row--archived {
		opacity: 0.7;
	}
	&__th--over,
	&__cell--over {
		background: #fff1f0;
		color: #a40000;
	}
	&__th-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: flex-end;
	}
	&__capacity {
		color: #446;
		opacity: 0.7;
	}
	&__empty {
		color: #446;
	}
}
</style>
