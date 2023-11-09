import Widget from "./Widget";

/** The scene is the interface on which the widgets are located */
export default abstract class Scene {
	private widgets: Widget[] = [];

	/** Function for adding a widget to a scene */
	protected addWidget<T extends Widget>(widget: T): T {
		this.widgets.push(widget);
		return widget;
	}

	/** Function for hiding the scene */
	abstract hideScene(hasAnimations: boolean): void;
	/** Function for displaying the scene */
	abstract showScene(hasAnimations: boolean): void;
}
