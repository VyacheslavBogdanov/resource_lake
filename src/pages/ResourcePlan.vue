<template>
	<section class="plan">
		<h1 class="plan__title">Ресурсный план</h1>

		<!-- KPI -->
		<div class="plan__kpis" v-if="store.groups.length || store.projects.length">
			<div class="plan__kpi">
				<div class="plan__kpi-label">Проектов</div>
				<div class="plan__kpi-value">{{ store.projects.length }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Групп</div>
				<div class="plan__kpi-value">{{ store.groups.length }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Общая ёмкость</div>
				<div class="plan__kpi-value">{{ totalCapacity }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Заложено</div>
				<div class="plan__kpi-value">{{ totalAllocated }}</div>
			</div>
			<div class="plan__kpi plan__kpi--util">
				<div class="plan__kpi-label">Утилизация</div>
				<div class="plan__kpi-value">
					<span :class="['plan__util-badge', utilClass]">{{ utilization }}%</span>
				</div>
			</div>
		</div>

		<div class="plan__table-wrapper" v-if="store.projects.length && store.groups.length">
			<table class="plan__table" aria-label="Таблица ресурсного плана">
				<!-- РОВНАЯ раскладка: фикс ширин колонок -->
				<colgroup>
					<col style="width: 28ch" />
					<!-- Проект -->
					<col v-for="g in store.groups" :key="g.id" style="width: 12ch" />
					<!-- Группы -->
					<col style="width: 16ch" />
					<!-- Итого по проекту -->
				</colgroup>

				<thead>
					<tr class="plan__head-row">
						<th class="plan__th plan__th--sticky plan__th--left">
							<div class="plan__th-inner" title="Проект">Проект</div>
						</th>

						<th
							v-for="g in store.groups"
							:key="g.id"
							class="plan__th"
							:class="{
								'plan__th--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
							:title="`${g.name}: заложено ${store.colTotals[g.id] || 0} ч из ${
								g.capacityHours
							} ч`"
						>
							<div class="plan__th-inner">
								<span class="plan__th-name" :title="g.name">{{ g.name }}</span>
								<small class="plan__capacity">{{ g.capacityHours }} ч</small>
								<div class="plan__th-progress" aria-hidden="true">
									<div
										class="plan__th-progress-bar"
										:style="{
											width: headerBars[g.id]?.fillPct + '%',
											background: headerBars[g.id]?.fillColor,
										}"
									></div>
								</div>
							</div>
						</th>

						<th class="plan__th plan__th--total">
							<div class="plan__th-inner" title="Итого (по проекту)">
								Итого (по проекту)
							</div>
						</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="p in store.projects"
						:key="p.id"
						class="plan__row"
						:class="{ 'plan__row--archived': p.archived }"
					>
						<th class="plan__cell plan__sticky plan__sticky--left">
							<div class="plan__cell-inner plan__cell-inner--left" :title="p.name">
								{{ p.name }}
							</div>
						</th>

						<td
							v-for="g in store.groups"
							:key="g.id"
							class="plan__cell"
							:class="{
								'plan__cell--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
						>
							<div class="plan__cell-inner" :title="`${p.name} • ${g.name}`">
								{{ store.valueByPair(p.id, g.id) }}
							</div>
						</td>

						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" :title="`Итого по проекту ${p.name}`">
								{{ store.rowTotalByProject(p.id) }}
							</div>
						</td>
					</tr>
				</tbody>

				<tfoot>
					<tr>
						<th class="plan__th plan__th--sticky plan__th--left">
							<div class="plan__th-inner">Итого (по группе)</div>
						</th>
						<td
							v-for="g in store.groups"
							:key="g.id"
							class="plan__cell plan__cell--footer"
							:class="{
								'plan__cell--over': (store.colTotals[g.id] || 0) > g.capacityHours,
							}"
						>
							<div class="plan__cell-inner" :title="`Итого по группе ${g.name}`">
								{{ store.colTotals[g.id] || 0 }}
							</div>
						</td>
						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" title="Итог по всем проектам">
								{{ store.grandTotal }}
							</div>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<p v-else class="plan__empty">Добавьте проекты и группы ресурсов, чтобы увидеть план.</p>

		<!-- Диаграмма (ровная сетка) -->
		<div v-if="store.groups.length" class="plan__chart">
			<div class="plan__chart-head">
				<h2 class="plan__chart-title">Загрузка по группам</h2>
				<div class="plan__legend">
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--overspending"></i>
						Перерасход
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--alloc"></i> Заложено
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--cap"></i> Ёмкость
					</span>
				</div>
			</div>

			<div class="plan__bars">
				<div v-for="row in chartRows" :key="row.id" class="plan__bar-row">
					<div class="plan__bar-label" :title="row.name">{{ row.name }}</div>
					<div class="plan__bar-track" :title="`Ёмкость: ${row.capacity} ч`">
						<div
							class="plan__bar plan__bar--fill"
							:style="{ width: row.fillPct + '%', background: row.fillColor }"
							:title="`Заложено: ${row.allocated} ч`"
						></div>
					</div>
					<div class="plan__bar-value">{{ row.allocated }} / {{ row.capacity }} ч</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useResourceStore } from '../stores/resource';

const store = useResourceStore();
onMounted(() => store.fetchAll());

/* KPI */
const totalCapacity = computed(() =>
	store.groups.reduce((s, g) => s + (Number(g.capacityHours) || 0), 0),
);
const totalAllocated = computed(() => Number(store.grandTotal) || 0);
const utilization = computed(() =>
	totalCapacity.value
		? Math.min(100, Math.round((totalAllocated.value / totalCapacity.value) * 100))
		: 0,
);
const utilClass = computed(() => {
	if (utilization.value > 100) return 'is-over';
	if (utilization.value >= 90) return 'is-warn';
	return 'is-ok';
});

/* Прогресс для заголовков по группам */
type HeaderBar = { fillPct: number; fillColor: string };
const headerBars = computed<Record<number, HeaderBar>>(() => {
	const map: Record<number, HeaderBar> = {};
	for (const g of store.groups) {
		const capacity = Number(g.capacityHours) || 0;
		const allocated = Number(store.colTotals[g.id] || 0);
		let fillPct = 0;
		let fillColor = 'var(--blue-600)';

		if (capacity <= 0) {
			if (allocated > 0) {
				fillPct = 100;
				fillColor = '#ef4444';
			} else {
				fillPct = 0;
			}
		} else if (allocated === capacity) {
			fillPct = 100;
			fillColor = 'var(--blue-600)';
		} else if (allocated > capacity) {
			fillPct = 100;
			fillColor = '#ef4444';
		} else {
			fillPct = Math.max(0, Math.min(100, (allocated / capacity) * 100));
			fillColor = 'var(--blue-600)';
		}
		map[g.id] = { fillPct, fillColor };
	}
	return map;
});

/* Диаграмма */
const chartRows = computed(() => {
	return store.groups.map((g) => {
		const capacity = Number(g.capacityHours) || 0;
		const allocated = Number(store.colTotals[g.id] || 0);

		let fillPct = 0;
		let fillColor = 'var(--blue-600)';

		if (capacity <= 0) {
			if (allocated > 0) {
				fillPct = 100;
				fillColor = '#ef4444';
			} else {
				fillPct = 0;
			}
		} else if (allocated === capacity) {
			fillPct = 100;
			fillColor = 'var(--blue-600)';
		} else if (allocated > capacity) {
			fillPct = 100;
			fillColor = '#ef4444';
		} else {
			fillPct = Math.max(0, Math.min(100, (allocated / capacity) * 100));
			fillColor = 'var(--blue-600)';
		}

		return { id: g.id, name: g.name, capacity, allocated, fillPct, fillColor };
	});
});
</script>

<style scoped lang="scss">
.plan {
	/* Базовая сетка и размеры — для ровности */
	--row-h: 44px; /* высота строки таблицы */
	--th-h: 64px; /* высота заголовка колонки */
	--bar-h: 14px; /* высота полос бар-чарта */

	&__title {
		margin-bottom: 16px;
	}

	/* KPI */
	&__kpis {
		display: grid;
		grid-template-columns: repeat(5, minmax(130px, 1fr));
		gap: 10px;
		margin-bottom: 12px;
	}
	&__kpi {
		background: #fff;
		border: 1px solid #e6eef7;
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 10px 12px;
		min-height: 72px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	&__kpi-label {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 4px;
	}
	&__kpi-value {
		font-size: 18px;
		font-weight: 700;
		color: #0a1a2b;
	}
	&__kpi--util .plan__kpi-value {
		display: flex;
		align-items: center;
	}
	.plan__util-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 10px;
		border-radius: 999px;
		border: 1px solid #cfe1ff;
		background: #e7f3ff;
		color: #0a1a2b;
		font-size: 13px;
	}
	.plan__util-badge.is-ok {
		background: #e7f3ff;
		border-color: #cfe1ff;
	}
	.plan__util-badge.is-warn {
		background: #fff7e6;
		border-color: #ffe1a6;
	}
	.plan__util-badge.is-over {
		background: #fff1f0;
		border-color: #ffc9c7;
		color: #a40000;
	}

	/* Таблица */
	&__table-wrapper {
		overflow-x: auto;
		background: #fff;
		box-shadow: var(--shadow);
		border-radius: 12px;
	}
	&__table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		border-radius: 12px;
		overflow: hidden;
	}

	.plan__head-row {
		background: var(--blue-100, #eef5ff);
	}

	&__th,
	&__cell {
		padding: 0 10px; /* вертикальные паддинги убраны — высоту держит inner */
		text-align: center;
		border-bottom: 1px solid #e9eef6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: middle;
	}

	/* Внутренние контейнеры фиксируют высоту = ровные строки/заголовки */
	&__th-inner {
		height: var(--th-h);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		padding: 8px 0;
	}
	&__cell-inner {
		height: var(--row-h);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	&__cell-inner--left {
		justify-content: flex-start;
	}

	/* Зебра/ховер для ровной сетки */
	tbody .plan__row:nth-child(odd) {
		background: #fbfdff;
	}
	tbody .plan__row:hover {
		background: #f2f7ff;
	}

	&__th--left,
	&__sticky--left {
		text-align: left;
	}

	&__th--sticky,
	&__sticky {
		position: sticky;
		left: 0;
		background: #f8fbff;
		text-align: left;
		z-index: 1;
		box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.08); /* тонкая тень-разделитель */
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
		opacity: 0.72;
	}

	&__th--over,
	&__cell--over {
		background: #fff1f0;
		color: #a40000;
	}

	&__th-name {
		font-weight: 600;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__capacity {
		color: #446;
		opacity: 0.75;
	}

	/* Микро-прогресс в заголовке (ровная высота) */
	&__th-progress {
		width: 100%;
		height: 6px;
		background: #eef4ff;
		border: 1px solid #dbe7ff;
		border-radius: 999px;
		overflow: hidden;
	}
	&__th-progress-bar {
		height: 100%;
		width: 0%;
		border-radius: 999px;
		transition: width 0.25s ease, background-color 0.2s ease;
	}

	&__empty {
		color: #446;
		margin-top: 8px;
	}

	/* Диаграмма */
	&__chart {
		margin-top: 18px;
		background: #fff;
		border: 1px solid #e6eef7;
		box-shadow: var(--shadow);
		padding: 14px;
		border-radius: 12px;
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
	&__legend-swatch--overspending {
		background: rgb(239, 68, 68);
	}

	&__bars {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 6px;
	}

	&__bar-row {
		display: grid;
		grid-template-columns: 28ch 1fr 16ch; /* совпадает с colgroup → ровная сетка */
		align-items: center;
		gap: 10px;
		min-height: 32px;
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
		height: var(--bar-h);
		background: #eef4ff;
		border: 1px solid #dbe7ff;
		border-radius: 999px;
		overflow: hidden;
	}
	&__bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-radius: 999px;
		transition: width 0.3s ease, background-color 0.2s ease;
	}
	// &__bar--fill {
	// 	/* цвет и ширина задаются инлайном */
	// }

	&__bar-value {
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: #334155;
		white-space: nowrap;
		text-align: right;
	}
}
</style>
