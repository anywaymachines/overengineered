import { ClientComponent } from "client/component/ClientComponent";
import { ComponentChild } from "shared/component/ComponentChild";

export class SelectorParent extends ClientComponent {
	private readonly currentSelector = new ComponentChild<IComponent>(this, true);
	readonly childSet = this.currentSelector.childSet;

	constructor() {
		super();
	}

	tryEnableSelector(ctor: () => IComponent) {
		if (this.currentSelector.get()) return;
		this.currentSelector.set(ctor());
	}
}
