import Control from "client/base/Control";

/** A GUI element that has children */
export class ListControl<T extends GuiObject, TControl extends Control = Control> extends Control<T> {
	private readonly children: TControl[] = [];

	constructor(gui: T) {
		super(gui);
	}

	/** Returns a list of added children */
	getChildren(): readonly TControl[] {
		return this.children;
	}

	/** Add a child */
	add(child: TControl) {
		child.setParent(this.gui);
		this.children.push(child);
	}

	/** Remove a child */
	remove(child: TControl) {
		if (!this.children.includes(child)) return;

		child.setParent(undefined);
		this.children.remove(this.children.indexOf(child));
	}

	/** Clear all added children */
	clear() {
		this.children.forEach((child) => child.setParent(undefined));
		this.children.clear();
	}
}
