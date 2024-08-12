import { ObservableValue } from "shared/event/ObservableValue";

export class ComponentDisabler<TItem extends defined> {
	private readonly _enabled = new ObservableValue<readonly TItem[]>([]);
	private readonly _disabled = new ObservableValue<readonly TItem[]>([]);
	readonly enabled = this._enabled.asReadonly();
	readonly disabled = this._disabled.asReadonly();

	private readonly allItems: readonly TItem[];

	constructor(allItems: readonly TItem[]) {
		this.allItems = allItems;

		this._enabled.set(this.allItems);
		this.enabled.subscribe((enabled) => this._disabled.set(this.allItems.except(enabled)));
	}

	isEnabled(item: TItem) {
		return this.enabled.get().includes(item);
	}
	isDisabled(item: TItem) {
		return !this.isEnabled(item);
	}

	/** Enable/disable items */
	set(enabled: boolean, ...items: readonly TItem[]) {
		if (enabled) this.enable(...items);
		else this.disable(...items);
	}

	enableAll() {
		this._enabled.set(this.allItems);
	}
	disableAll() {
		this._enabled.set([]);
	}

	enable(...items: readonly TItem[]) {
		this.setEnabled(...[...items, ...this.enabled.get()]);
	}
	disable(...items: readonly TItem[]) {
		this.setEnabled(...this.enabled.get().except(items));
	}

	enableOnly(...items: readonly TItem[]) {
		this.setEnabled(...items);
	}
	disableOnly(...items: readonly TItem[]) {
		this.setDisabled(...items);
	}

	private setEnabled(...items: readonly TItem[]) {
		this._enabled.set([...new Set(items)]);
	}
	private setDisabled(...items: readonly TItem[]) {
		this._enabled.set(this.allItems.filter((item) => !items.includes(item)));
	}
}
