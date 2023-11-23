import Control from "client/base/Control";

/** A GUI element that has children */
export class ListControl<T extends GuiObject, TControl extends Control = Control> extends Control<T> {
	constructor(gui: T) {
		super(gui);
	}

	/** Returns a list of added children */
	public getChildren(): readonly TControl[] {
		return super.getChildren() as TControl[];
	}

	/** Add a child */
	public add(child: TControl) {
		super.add(child);
	}

	/** Remove a child */
	public remove(child: TControl) {
		super.remove(child);
	}
}
