/** A filter that you can add checks into. On fire returns false when any of the callbacks returns false. */
export class SlimFilter<T extends (...args: never[]) => boolean = () => true> {
	private subscribed?: T[];

	add(callback: T): void {
		(this.subscribed ??= []).push(callback);
	}
	Fire(...args: Parameters<T>): boolean {
		if (!this.subscribed) return true;

		for (const sub of this.subscribed) {
			if (!sub(...args)) {
				return false;
			}
		}

		return true;
	}

	unsubscribeAll() {
		this.subscribed?.clear();
	}
}
