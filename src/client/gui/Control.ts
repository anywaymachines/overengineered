import { ClientInstanceComponent } from "client/component/ClientInstanceComponent";

/** A component that is a GUI element */
export default class Control<
	T extends GuiObject = GuiObject,
	TChild extends IComponent = IComponent,
> extends ClientInstanceComponent<T, TChild> {
	private visible;
	protected readonly gui: T;

	constructor(gui: T) {
		super(gui);

		this.gui = gui;
		this.visible = gui.Visible;

		this.children.onAdded.Connect((instance) => {
			// needed because `instanceof Control` results in `instance` being `Control<any, any>`
			const isControl = (instance: IComponent): instance is Control => instance instanceof Control;

			if (isControl(instance) && instance.instance.Parent === this.gui) {
				instance.instance.LayoutOrder = this.getChildren().size();
			}
		});
	}

	enable() {
		if (!this.isVisible()) return;
		super.enable();
	}

	/** Is control visible */
	isVisible() {
		return this.visible;
	}

	/** Show the control and enable it with the children */
	show() {
		this.visible = true;
		this.setInstanceVisibilityFunction(true);

		this.enable();
	}
	protected setInstanceVisibilityFunction(visible: boolean) {
		this.instance.Visible = visible;
	}

	/** Hide the control and disable it with the children */
	hide() {
		this.visible = false;
		this.setInstanceVisibilityFunction(false);

		this.disable();
	}

	readonly setVisible = (visible: boolean) => (visible ? this.show() : this.hide());
}
