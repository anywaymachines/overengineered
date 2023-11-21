import Widget from "./Widget";

export default abstract class Control<T extends Frame> extends Widget {
	public readonly gui: T;

	constructor(gui: T) {
		super();
		this.gui = gui.Clone();
	}

	isVisible() {
		return this.gui.Visible;
	}
	setVisible(value: boolean) {
		this.gui.Visible = value;
	}
}
