<!-- <template>
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
								<small class="plan__capacity">{{ g.capacityHours }} (ч.ч.)</small>
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
		box-shadow: var(--shadow);
	}
	&__table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 1px;
		table-layout: fixed;
	}
	&__th,
	&__cell {
		padding: 10px 10px;
		text-align: center;
		border-bottom: 1px solid #e9eef6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__th--sticky,
	&__sticky {
		position: sticky;
		left: 0;
		background: #f8fbff;
		text-align: center;
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
		align-items: center;
	}
	&__capacity {
		color: #446;
		opacity: 0.7;
	}
	&__empty {
		color: #446;
	}
}
</style> -->

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
								<small class="plan__capacity">{{ g.capacityHours }} (ч.ч.)</small>
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

		<!-- Диаграмма загрузки по группам -->
		<div v-if="store.groups.length" class="plan__chart">
			<div class="plan__chart-head">
				<h2 class="plan__chart-title">Загрузка по группам</h2>
				<div class="plan__legend">
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--alloc"></i> Заложено
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--cap"></i> Ёмкость
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--over"></i> Перерасход
					</span>
				</div>
			</div>

			<div class="plan__bars">
				<div v-for="row in chartRows" :key="row.id" class="plan__bar-row">
					<div class="plan__bar-label" :title="row.name">{{ row.name }}</div>

					<div class="plan__bar-track">
						<!-- основная заложенная часть (в пределах ёмкости) -->
						<div
							class="plan__bar plan__bar--alloc"
							:style="{ width: row.allocPct + '%' }"
							:title="`${row.allocated} ч из ${row.capacity} ч`"
						></div>

						<!-- перерасход (поверх, начиная от маркера ёмкости) -->
						<div
							v-if="row.overflowPct > 0"
							class="plan__bar plan__bar--over"
							:style="{ left: row.capacityPct + '%', width: row.overflowPct + '%' }"
							:title="`Перерасход: ${row.overflow} ч`"
						></div>

						<!-- маркер позиции ёмкости -->
						<div
							class="plan__cap-marker"
							:style="{ left: row.capacityPct + '%' }"
							:title="`Ёмкость: ${row.capacity} ч`"
						></div>
					</div>

					<div class="plan__bar-value">{{ row.allocated }} / {{ row.capacity }} ч</div>
				</div>
			</div>

			<div class="plan__chart-foot" v-if="maxValue > 0">
				<span class="plan__scale">Масштаб по максимуму: {{ maxValue }} ч</span>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useResourceStore } from '../stores/resource';

const store = useResourceStore();
onMounted(() => store.fetchAll());

/** Подготовка данных для диаграммы (реактивно) */
const maxValue = computed(() => {
	// общий масштаб — максимум из capacity и allocated среди всех групп
	return (
		store.groups.reduce((m, g) => {
			const alloc = store.colTotals[g.id] || 0;
			return Math.max(m, g.capacityHours || 0, alloc);
		}, 0) || 1
	); // защита от деления на 0
});

const chartRows = computed(() => {
	const max = maxValue.value || 1;
	return store.groups.map((g) => {
		const capacity = g.capacityHours || 0;
		const allocated = store.colTotals[g.id] || 0;
		const safeAlloc = Math.min(allocated, capacity);
		const overflow = Math.max(allocated - capacity, 0);

		const capacityPct = Math.min(100, (capacity / max) * 100);
		const allocPct = Math.min(100, (safeAlloc / max) * 100);
		const overflowPct = Math.min(100 - capacityPct, (overflow / max) * 100);

		return {
			id: g.id,
			name: g.name,
			capacity,
			allocated,
			overflow,
			capacityPct,
			allocPct,
			overflowPct,
		};
	});
});
</script>

<style scoped lang="scss">
.plan {
	&__title {
		margin-bottom: 16px;
	}

	&__table-wrapper {
		overflow-x: auto;
		background: #fff;
		box-shadow: var(--shadow);
	}

	&__table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 1px;
		table-layout: fixed;
	}

	&__th,
	&__cell {
		padding: 10px 10px;
		text-align: center;
		border-bottom: 1px solid #e9eef6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__th--sticky,
	&__sticky {
		position: sticky;
		left: 0;
		background: #f8fbff;
		text-align: center;
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
		align-items: center;
	}
	&__capacity {
		color: #446;
		opacity: 0.7;
	}
	&__empty {
		color: #446;
	}

	/* ===== Диаграмма ===== */
	&__chart {
		margin-top: 18px;
		background: #fff;
		border: 1px solid #e6eef7;
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 14px;
	}

	&__chart-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}
	&__chart-title {
		font-size: 18px;
		margin: 0;
	}

	&__legend {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
	}
	&__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #334155;
		font-size: 13px;
	}
	&__legend-swatch {
		width: 14px;
		height: 10px;
		border-radius: 3px;
		display: inline-block;
	}
	&__legend-swatch--alloc {
		background: var(--blue-600);
	}
	&__legend-swatch--cap {
		background: #cfe1ff;
	}
	&__legend-swatch--over {
		background: #ffb3b3;
	}

	&__bars {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 6px;
	}

	&__bar-row {
		display: grid;
		grid-template-columns: 1fr 6fr auto;
		align-items: center;
		gap: 10px;
	}
	&__bar-label {
		font-size: 14px;
		color: #0a1a2b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__bar-track {
		position: relative;
		height: 14px;
		background: #eef4ff; /* полоса фона = «ёмкость» */
		border: 1px solid #dbe7ff;
		border-radius: 999px;
		overflow: hidden;
	}

	/* заложенные часы (в пределах ёмкости) */
	&__bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-radius: 999px;
	}
	&__bar--alloc {
		background: var(--blue-600);
	}

	/* перерасход — поверх и начиная от маркера ёмкости */
	&__bar--over {
		position: absolute;
		top: 0;
		height: 100%;
		background: #ffb3b3;
	}

	/* вертикальный маркер ёмкости */
	&__cap-marker {
		position: absolute;
		top: -2px;
		width: 2px;
		height: 18px;
		background: #1d4ed8;
		opacity: 0.75;
		transform: translateX(-1px);
	}

	&__bar-value {
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: #334155;
		white-space: nowrap;
	}

	&__chart-foot {
		margin-top: 10px;
		display: flex;
		justify-content: flex-end;
	}
	&__scale {
		font-size: 12px;
		color: #6b7280;
	}
}
</style>
