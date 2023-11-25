import Control from "./Control";

/** The scene is the interface on which the widgets are located */
export default abstract class Scene<
	T extends GuiObject | Instance = Instance,
	TParams extends unknown[] = [],
> extends Control<T> {
	constructor(gui: T) {
		super(gui);
	}

	/** Show the scene */
	public show(...args: TParams) {
		this.setVisible(true);
	}

	/** Hide the scene */
	public hide() {
		this.setVisible(false);
	}
}
