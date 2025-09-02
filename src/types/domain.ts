export interface Project {
	id: number;
	name: string;
	archived?: boolean;
}

export interface Group {
	id: number;
	name: string;
	capacityHours: number;
}

export interface Allocation {
	id: number;
	projectId: number;
	groupId: number;
	hours: number;
}
