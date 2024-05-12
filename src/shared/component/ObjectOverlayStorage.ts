import { Signal } from "shared/event/Signal";

export class ObjectOverlayStorage<T extends object> {
	private readonly _updated = new Signal<(value: T) => void>();
	readonly updated = this._updated.asReadonly();

	private readonly order: number[] = [];
	private readonly overlays: Record<number, readonly [meta: Partial<T>, backend: Partial<T>]> = {};

	constructor(defaultValues: T, changed?: (value: T) => void) {
		this.order.push(9999999999);
		this.overlays[9999999999] = [defaultValues, defaultValues];

		if (changed) {
			this.updated.Connect(changed);
		}
	}

	getValues(): T {
		const ret: Partial<T> = {};
		for (const k of this.order) {
			for (const [key, value] of pairs(this.overlays[k][1])) {
				if (key in ret) continue;
				ret[key] = value;
			}
		}

		return ret as T;
	}

	/** Register an overlay
	 * @param zindex The order of the overlay, lower is earlier.
	 */
	get(zindex: number) {
		if (this.overlays[zindex] !== undefined) {
			return this.overlays[zindex][0];
		}

		this.order.push(zindex);
		table.sort(this.order);

		const backend: Partial<T> = {};
		const metatable: LuaMetatable<Partial<T>> = {
			__index: (_, key) => rawget(backend, key),
			__newindex: (_, key, value) => {
				rawset(backend, key, value);
				this._updated.Fire(this.getValues());
			},
		};

		const overlay: Partial<T> = {};
		setmetatable(overlay, metatable);
		this.overlays[zindex] = [overlay, backend];

		return overlay;
	}
}
