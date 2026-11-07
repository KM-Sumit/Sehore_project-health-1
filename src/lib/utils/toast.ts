import { SvelteMap } from 'svelte/reactivity';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

class ToastStore {
	private _map = new SvelteMap<string, Toast>();

	get items(): Toast[] {
		return Array.from(this._map.values());
	}

	add(message: string, type: ToastType = 'info', duration = 4000): string {
		const id = crypto.randomUUID();
		const toast: Toast = { id, message, type };
		this._map.set(id, toast);

		if (duration > 0) {
			setTimeout(() => this.remove(id), duration);
		}

		return id;
	}

	remove(id: string) {
		this._map.delete(id);
	}
}

export const toasts = new ToastStore();

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
	return toasts.add(message, type, duration);
}

export function removeToast(id: string) {
	toasts.remove(id);
}
