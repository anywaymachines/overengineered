/** A signal that you can subscribe to and fire but without any unnesessary things */
export default class SlimSignal<T extends (...args: never[]) => void = () => void> {
	private subscribed?: T[];

	subscribe(callback: T): void {
		(this.subscribed ??= []).push(callback);
	}
	fire(...args: Parameters<T>): void {
		if (!this.subscribed) return;

		for (const sub of this.subscribed) {
			sub(...args);
		}
	}

	Connect(callback: T): void {
		this.subscribe(callback);
	}
	Fire(...args: Parameters<T>): void {
		this.fire(...args);
	}

	unsubscribeAll() {
		this.subscribed?.clear();
	}
}
