/** A signal that you can subscribe to and fire but without any unnesessary things */
export class SlimSignal<T extends (...args: never[]) => void = () => void> {
	private destroyed = false;
	private subscribed?: T[];

	Connect(callback: T): void {
		if (this.destroyed) return;
		(this.subscribed ??= []).push(callback);
	}
	Fire(...args: Parameters<T>): void {
		if (!this.subscribed) return;

		for (const sub of this.subscribed) {
			sub(...args);
		}
	}

	destroy() {
		this.destroyed = true;
		this.subscribed = undefined;
	}
}
