/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {
		user: {
			id: string;
			name: string;
			email: string;
			role: 'user' | 'admin' | 'doctor';
		} | null;
	}

	interface PageData {
		user: App.Locals['user'];
	}
}

