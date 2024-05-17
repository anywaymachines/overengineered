import { ArgsSignal } from "shared/event/Signal";

export namespace SharedGameLoader {
	export const loadingStarted = new ArgsSignal<[name: string | undefined]>();
	export const loadingCompleted = new ArgsSignal<[name: string | undefined]>();
	export const loadingError = new ArgsSignal<[err: unknown]>();

	export function lazyLoader(name: string | undefined, func: () => void) {
		let loaded = false;

		return () => {
			if (loaded) return;
			loaded = true;

			wrapLoading(name, func);
		};
	}
	export function wrapLoading(name: string | undefined, func: () => void) {
		loadingStarted.Fire(name);

		try {
			func();
			loadingCompleted.Fire(name);
		} catch (err) {
			loadingError.Fire(err);
			throw err;
		}
	}
}
