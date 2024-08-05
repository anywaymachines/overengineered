export namespace Throttler {
	/**
	 * Launch the task on each collection item, performing `task.wait()` after every {@link itemsPerFrame} items
	 * @param itemsPerFrame Amount of items to process per frame
	 * @param items Items array
	 * @param func Function to execute
	 */
	export function forEach<T>(itemsPerFrame: number, items: readonly T[], func: (item: T) => void) {
		let i = 0;

		for (const item of items) {
			func(item);

			i++;
			if (i >= itemsPerFrame) {
				i = 0;
				task.wait();
			}
		}
	}

	export function retryOnFail<T>(
		times: number,
		delay: number,
		func: () => T,
	): { success: true; message: T } | { success: false; error_message: unknown } {
		try {
			return { success: true, message: func() };
		} catch (e) {
			if (times <= 1) {
				return { success: false, error_message: e };
			}

			task.wait(delay);
			return retryOnFail(times - 1, delay, func);
		}
	}
}
