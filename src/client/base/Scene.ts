import Widget from "./Widget";

export default abstract class Scene {
	widgets: Widget[] = [];

	/** Function for adding a widget to a scene */
	addWidget<T extends Widget>(widget: T): T {
		this.widgets.push(widget);
		return widget;
	}

	/** Function for displaying the scene */
	abstract showScene(hasAnimations: boolean): void;

	/** Function for hiding the scene */
	abstract hideScene(hasAnimations: boolean): void;
}
