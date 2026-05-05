import { reactive, readonly } from 'vue';

interface ConfirmDialogOptions {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'danger' | 'primary';
	mode?: 'confirm' | 'alert';
}

interface ConfirmDialogState {
	visible: boolean;
	title: string;
	message: string;
	confirmText: string;
	cancelText: string;
	variant: 'danger' | 'primary';
	mode: 'confirm' | 'alert';
}

let resolvePromise: ((value: boolean) => void) | null = null;

const state = reactive<ConfirmDialogState>({
	visible: false,
	title: '',
	message: '',
	confirmText: 'Удалить',
	cancelText: 'Отмена',
	variant: 'danger',
	mode: 'confirm',
});

function confirm(options: ConfirmDialogOptions): Promise<boolean> {
	const isAlert = options.mode === 'alert';

	state.title = options.title ?? '';
	state.message = options.message;
	state.confirmText = options.confirmText ?? (isAlert ? 'ОК' : 'Удалить');
	state.cancelText = options.cancelText ?? 'Отмена';
	state.variant = options.variant ?? (isAlert ? 'primary' : 'danger');
	state.mode = options.mode ?? 'confirm';
	state.visible = true;

	return new Promise<boolean>((resolve) => {
		resolvePromise = resolve;
	});
}

function alert(message: string): Promise<boolean> {
	return confirm({ message, mode: 'alert' });
}

function handleConfirm() {
	state.visible = false;
	resolvePromise?.(true);
	resolvePromise = null;
}

function handleCancel() {
	state.visible = false;
	resolvePromise?.(false);
	resolvePromise = null;
}

export function useConfirm() {
	return {
		state: readonly(state),
		confirm,
		alert,
		handleConfirm,
		handleCancel,
	};
}
