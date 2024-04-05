export interface ReadonlySignal<T extends (...args: never[]) => void = () => void> {
	Connect(callback: T): { Disconnect(): void };
}

/** A signal that you can subscribe to, unsibscribe from and fire */
export class Signal<T extends (...args: never[]) => void = () => void> implements ReadonlySignal<T> {
	private destroyed = false;
	private subscribed?: Set<unknown>; // unknown instead of T to workaround the type system
	private inSelf = 0;

	Connect(callback: T): { Disconnect(): void } {
		if (this.destroyed) return { Disconnect() {} };

		this.subscribed ??= new Set();
		this.subscribed.add(callback);

		const set = this.subscribed;
		return {
			Disconnect() {
				set.delete(callback);
			},
		};
	}
	Fire(...args: Parameters<T>): void {
		if (!this.subscribed) return;
		if (this.inSelf > 10) {
			print(`Signal self-calling overflow: ${debug.traceback()}`);
			throw "Signal self-calling overflow.";
		}

		this.inSelf++;
		try {
			for (const sub of this.subscribed) {
				try {
					(sub as T)(...args);
				} catch (err) {
					print(err, debug.traceback());
					throw err;
				}
			}
		} finally {
			this.inSelf = 0;
		}
	}

	destroy() {
		this.destroyed = true;
		this.subscribed = undefined;
	}

	asReadonly(): ReadonlySignal<T> {
		return this;
	}
}
