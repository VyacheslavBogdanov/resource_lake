export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body?: unknown,
	) {
		super(`${status} ${statusText}`);
		this.name = 'ApiError';
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}

	get isServerError(): boolean {
		return this.status >= 500;
	}

	get isNetworkError(): boolean {
		return this.status === 0;
	}
}
