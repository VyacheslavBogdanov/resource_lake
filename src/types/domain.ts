export interface Project {
	id: number;
	name: string;
	archived?: boolean;
	url?: string;
	customer?: string;
	projectType?: string;
	projectManager?: string;
	description?: string;
	order?: number;
}

export interface Group {
	id: number;
	name: string;
	capacityHours: number;
	supportPercent?: number;
	resourceType?: string;
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
