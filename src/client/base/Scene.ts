import Control from "./Control";

/** The scene is the interface on which the widgets are located */
export default abstract class Scene<T extends GuiObject = GuiObject> extends Control<T> {
	constructor(gui: T) {
		super(gui);
	}

	/** Displaying the scene */
	public show() {
		this.setVisible(true);
	}

	/** Hide the scene */
	public hide() {
		this.setVisible(false);
	}
}
