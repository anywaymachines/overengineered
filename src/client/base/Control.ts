import Signal from "@rbxts/signal";
import Component from "./Component";
import ComponentBase from "./ComponentBase";

print("control loaded");

/** A component that is a GUI element */
export default class Control<
	T extends GuiObject = GuiObject,
	TChild extends ComponentBase = ComponentBase,
> extends Component<T, TChild> {
	/** Signal that fires when this element is shown */
	public readonly onShow = new Signal<() => void>();

	/** Signal that fires when this element is hidden */
	public readonly onHide = new Signal<() => void>();

	private visible;
	protected readonly gui: T;

	constructor(gui: T) {
		super(gui);

		this.gui = gui;
		this.visible = gui.Visible;
	}

	/*public withGuiProps(properties: Partial<T>) {
		//Objects.assign(this.gui, properties);
		return this;
	}*/
	public when() {
		return this.gui;
	}
	public getGui() {
		return this.gui;
	}

	public enable() {
		if (!this.isVisible()) return;
		super.enable();
	}

	/** Is control visible */
	public isVisible() {
		return this.visible;
	}

	/** Show the control and enable it with the children */
	public show() {
		this.visible = true;
		this.instance.Visible = true;

		this.enable();
		this.onShow.Fire();
	}

	/** Hide the control and disable it with the children */
	public hide() {
		this.visible = false;
		this.instance.Visible = false;

		this.disable();
		this.onHide.Fire();
	}
}
