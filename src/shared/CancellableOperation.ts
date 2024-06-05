import { Component } from "shared/component/Component";

export class CancellableOperation<TArgs extends unknown[], TRet> extends Component {
	constructor(
		private readonly func: (...args: TArgs) => TRet,
		private readonly retOnCancel: TRet,
	) {
		super();
	}

	execute(...args: TArgs): TRet {
		const thread = task.spawn(this.func, ...args);

		let first = false;
		let result: unknown | Response | undefined = undefined;
		while (coroutine.status(thread) !== "dead") {
			if (this.isDestroyed()) {
				task.cancel(thread);
				return this.retOnCancel;
			}

			print("resuming");
			if (!first) {
				print("YELDING");
			}

			task.spawn(thread);
			const [success, ret] = coroutine.resume(thread);
			first = false;

			print("resuming GOT ", success, ret, coroutine.status(thread));
			if (this.isDestroyed()) {
				task.cancel(thread);
				return this.retOnCancel;
			}

			if (!success) {
				task.cancel(thread);
				throw ret;
			}

			result = ret;
		}

		print("END", result);
		return result as TRet;
	}
}
