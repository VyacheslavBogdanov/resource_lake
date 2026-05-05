import type { Ref } from 'vue';
import type { Project } from '../../../types/domain';
import { useProjectsStore } from '../../../stores/projects';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';
import type { ViewMode, Quarter } from './useViewMode';
import { quarterLabel, quarterNumbers } from './useViewMode';
import type { TableColumn } from './useGroupVisibility';

interface CsvDeps {
	viewMode: Ref<ViewMode>;
	selectedQuarter: Ref<Quarter>;
	displayByResourceType: Ref<boolean>;
	tableColumns: Ref<TableColumn[]>;
	sortedProjects: Ref<Project[]>;
	totalCapacity: Ref<number>;
	activeGrandTotal: Ref<number>;
	columnTotal: (col: TableColumn) => number;
	columnQuarterTotal: (col: TableColumn, quarter: Quarter) => number;
	cellValueByColumn: (projectId: number, col: TableColumn, archived?: boolean) => number;
	getQuarterCellByColumn: (projectId: number, col: TableColumn, q: Quarter, archived?: boolean) => number;
	projectQuarterTotal: (projectId: number, quarter: Quarter) => number;
}

export function useCsvExport(deps: CsvDeps) {
	const projectsStore = useProjectsStore();
	const allocationsStore = useAllocationsStore();

	function projectUrl(p: { url?: string }): string | null {
		const raw = (p.url ?? '').trim();
		if (!raw) return null;
		return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
	}

	function projectShareValue(projectId: number, archived?: boolean): string {
		const total = deps.totalCapacity.value;
		if (!total || archived) return '0';
		const row =
			deps.viewMode.value === 'quarterSingle'
				? deps.projectQuarterTotal(projectId, deps.selectedQuarter.value)
				: allocationsStore.rowTotalByProject(projectId);
		return String(roundInt((row / total) * 100));
	}

	function exportCsv() {
		if (!projectsStore.items.length) return;

		const delimiter = ';';
		const rows: string[] = [];
		const projects = deps.sortedProjects.value;

		if (deps.viewMode.value === 'total') {
			buildTotalCsv(rows, projects, delimiter);
		} else if (deps.viewMode.value === 'quarterSingle') {
			buildQuarterSingleCsv(rows, projects, delimiter);
		} else {
			buildQuarterSplitCsv(rows, projects, delimiter);
		}

		const csvContent = '\uFEFF' + rows.join('\r\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = deps.displayByResourceType.value ? 'resource-plan-by-type.csv' : 'resource-plan-by-group.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function buildTotalCsv(rows: string[], projects: Project[], delimiter: string) {
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...deps.tableColumns.value.map((col) => col.name),
			'Итого (по проекту)',
			'Размер проекта, %',
		];
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [
				p.name,
				projectUrl(p) || '',
				(p.customer ?? '').trim(),
				(p.projectManager ?? '').trim(),
				(p.projectType ?? '').trim(),
			];
			for (const col of deps.tableColumns.value) {
				cells.push(p.archived ? 0 : deps.cellValueByColumn(p.id, col, false));
			}
			cells.push(p.archived ? 0 : allocationsStore.rowTotalByProject(p.id));
			cells.push(projectShareValue(p.id, p.archived));
			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footer: (string | number)[] = ['Итого (по группе/типу)'];
		for (const col of deps.tableColumns.value) footer.push(deps.columnTotal(col) || 0);
		footer.push(deps.activeGrandTotal.value);
		footer.push('100');
		rows.push(footer.map(csvValue).join(delimiter));
	}

	function buildQuarterSingleCsv(rows: string[], projects: Project[], delimiter: string) {
		const q = deps.selectedQuarter.value;
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...deps.tableColumns.value.map((col) => `${col.name} (${quarterLabel[q]})`),
			`Итого (по проекту, ${quarterLabel[q]})`,
			`Размер проекта, %, ${quarterLabel[q]}`,
		];
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [
				p.name,
				projectUrl(p) || '',
				(p.customer ?? '').trim(),
				(p.projectManager ?? '').trim(),
				(p.projectType ?? '').trim(),
			];
			for (const col of deps.tableColumns.value) {
				cells.push(deps.getQuarterCellByColumn(p.id, col, q, p.archived) ?? 0);
			}
			const rowTotal = p.archived ? 0 : deps.projectQuarterTotal(p.id, q);
			cells.push(rowTotal);
			const totalCap = deps.totalCapacity.value || 1;
			cells.push(String(p.archived ? 0 : roundInt((rowTotal / totalCap) * 100)));
			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footer: (string | number)[] = ['Итого (по группе/типу)'];
		for (const col of deps.tableColumns.value) footer.push(deps.columnQuarterTotal(col, q) || 0);
		footer.push(deps.activeGrandTotal.value);
		footer.push('100');
		rows.push(footer.map(csvValue).join(delimiter));
	}

	function buildQuarterSplitCsv(rows: string[], projects: Project[], delimiter: string) {
		const header: string[] = ['Проект', 'Ссылка', 'Заказчик', 'Руководитель проекта', 'Тип проекта'];
		for (const col of deps.tableColumns.value) {
			for (const q of quarterNumbers) header.push(`${col.name} (${quarterLabel[q]})`);
		}
		header.push('Итого (по проекту)', 'Размер проекта, % (общий)');
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [
				p.name,
				projectUrl(p) || '',
				(p.customer ?? '').trim(),
				(p.projectManager ?? '').trim(),
				(p.projectType ?? '').trim(),
			];
			for (const col of deps.tableColumns.value) {
				for (const q of quarterNumbers) {
					cells.push(deps.getQuarterCellByColumn(p.id, col, q, p.archived) ?? 0);
				}
			}
			cells.push(p.archived ? 0 : allocationsStore.rowTotalByProject(p.id));
			cells.push(projectShareValue(p.id, p.archived));
			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footer: (string | number)[] = ['Итого (по группе/типу)'];
		for (const col of deps.tableColumns.value) {
			for (const q of quarterNumbers) footer.push(deps.columnQuarterTotal(col, q) || 0);
		}
		footer.push(deps.activeGrandTotal.value);
		footer.push('100');
		rows.push(footer.map(csvValue).join(delimiter));
	}

	return { exportCsv, projectUrl };
}

function csvValue(raw: unknown): string {
	const str =
		raw === null || raw === undefined
			? ''
			: String(raw)
					.replace(/\r\n|\n|\r/g, ' ')
					.trim();
	return `"${str.replace(/"/g, '""')}"`;
}
