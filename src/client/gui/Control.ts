import Signal from "@rbxts/signal";
import { ClientInstanceComponent } from "client/component/ClientInstanceComponent";

/** A component that is a GUI element */
export default class Control<
	T extends GuiObject = GuiObject,
	TChild extends IComponent = IComponent,
> extends ClientInstanceComponent<T, TChild> {
	/** Signal that fires when this element is shown */
	readonly onShow = new Signal<() => void>();

	/** Signal that fires when this element is hidden */
	readonly onHide = new Signal<() => void>();

	private visible;
	protected readonly gui: T;

	constructor(gui: T) {
		super(gui);

		this.gui = gui;
		this.visible = gui.Visible;

		this.children.onAdded.Connect((instance) => {
			// needed because `instanceof Control` results in `instance` being `Control<any, any>`
			const isControl = (instance: IComponent): instance is Control => instance instanceof Control;

			if (isControl(instance) && instance.getGui().Parent === this.gui) {
				instance.getGui().LayoutOrder = this.getChildren().size();
			}
		});
	}

	getGui(): T {
		return this.gui;
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
		this.instance.Visible = true;

		this.enable();
		this.onShow.Fire();
	}

	/** Hide the control and disable it with the children */
	hide() {
		this.visible = false;
		this.instance.Visible = false;

		this.disable();
		this.onHide.Fire();
	}
}
