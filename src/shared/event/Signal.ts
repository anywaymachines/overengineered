export interface ReadonlyArgsSignal<TArgs extends unknown[]> {
	Connect(callback: (...args: TArgs) => void): { Disconnect(): void };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ReadonlySignal<T extends (...args: any) => void = () => void>
	extends ReadonlyArgsSignal<Parameters<T>> {}

/** A signal that you can subscribe to, unsibscribe from and fire */
export class ArgsSignal<TArgs extends unknown[]> implements ReadonlyArgsSignal<TArgs> {
	private destroyed = false;
	private subscribed?: Set<unknown>; // unknown instead of T to workaround the type system
	private inSelf = 0;

	Connect(callback: (...args: TArgs) => void): { Disconnect(): void } {
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
	Fire(...args: TArgs): void {
		if (!this.subscribed) return;
		if (this.inSelf > 10) {
			print(`Signal self-calling overflow: ${debug.traceback()}`);
			throw "Signal self-calling overflow.";
		}

		this.inSelf++;
		try {
			for (const sub of this.subscribed) {
				try {
					(sub as (...args: TArgs) => void)(...args);
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

	asReadonly(): ReadonlyArgsSignal<TArgs> {
		return this;
	}
}

/** A signal that you can subscribe to, unsibscribe from and fire */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Signal<T extends (...args: any) => void = () => void> extends ArgsSignal<Parameters<T>> {}
