import type { Project, Group, Allocation } from '../../types/domain';

export type AllocationPayload = {
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
};

export type AllocationPayloadByProject = Record<number, AllocationPayload>;

export type ResourceState = {
	projects: Project[];
	groups: Group[];
	allocations: Allocation[];
	loading: boolean;
	hiddenGroupIds: number[];
};
