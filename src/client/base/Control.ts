import Signal from "@rbxts/signal";
import SharedComponentBase from "shared/component/SharedComponentBase";
import Component from "./Component";

/** A component that is a GUI element */
export default class Control<
	T extends GuiObject = GuiObject,
	TChild extends SharedComponentBase = SharedComponentBase,
> extends Component<T, TChild> {
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
	}

	getGui() {
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
