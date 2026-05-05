<script setup lang="ts">
defineProps<{
	projectsCount: number;
	groupsCount: number;
	totalCapacity: number;
	totalAllocated: number;
	totalSupport: number;
	utilization: number;
	utilClass: string;
}>();
</script>

<template>
	<div class="plan__kpis">
		<div class="plan__kpi">
			<div class="plan__kpi-label">Проектов</div>
			<div class="plan__kpi-value">{{ projectsCount }}</div>
		</div>
		<div class="plan__kpi">
			<div class="plan__kpi-label">Групп</div>
			<div class="plan__kpi-value">{{ groupsCount }}</div>
		</div>
		<div class="plan__kpi">
			<div class="plan__kpi-label">Общая емкость, ч</div>
			<div class="plan__kpi-value">{{ totalCapacity }}</div>
		</div>
		<div class="plan__kpi">
			<div class="plan__kpi-label">Заложено, ч</div>
			<div class="plan__kpi-value">{{ totalAllocated }}</div>
		</div>
		<div class="plan__kpi plan__kpi--support">
			<div class="plan__kpi-label">В поддержке, ч</div>
			<div class="plan__kpi-value">
				<span class="plan__pill plan__pill--support">{{ totalSupport }}</span>
			</div>
		</div>
		<div class="plan__kpi plan__kpi--util">
			<div class="plan__kpi-label">Утилизация, %</div>
			<div class="plan__kpi-value">
				<span :class="['plan__util-badge', utilClass]">{{ utilization }}%</span>
			</div>
		</div>
	</div>
</template>
