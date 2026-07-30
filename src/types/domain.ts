export type ProjectStatus = 'active' | 'completed';
export type ProjectCompletionEntryMode = 'groups' | 'total';

export interface ProjectCompletionResource {
	groupId: number;
	groupName: string;
	plannedHours: number;
	actualHours: number;
}

export interface ProjectCompletionInput {
	entryMode: ProjectCompletionEntryMode;
	actualTotalHours: number;
	resources: ProjectCompletionResource[];
}

export interface ProjectCompletion {
	completedAt: string;
	entryMode?: ProjectCompletionEntryMode;
	actualTotalHours?: number;
	resources: ProjectCompletionResource[];
}

export interface Project {
	id: number;
	name: string;
	status?: ProjectStatus;
	completedAt?: string | null;
	completion?: ProjectCompletion;
	archived?: boolean;
	url?: string;
	customer?: string;
	projectType?: string;
	projectManager?: string;
	description?: string;
	order?: number;
	allocationsUpdatedAt?: string;
	actualizedAt?: string;
	actualizedStale?: boolean;
}

export interface Group {
	id: number;
	name: string;
	headcount: number;
	capacityHours: number;
	allocationsUpdatedAt?: string;
	description?: string;
	supportPercent?: number;
	resourceType?: string;
	position?: number;
}

export interface Allocation {
	id: number;
	projectId: number;
	groupId: number;
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
}

export type AllocationPayload = {
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
};

export type AllocationPayloadByProject = Record<number, AllocationPayload>;
