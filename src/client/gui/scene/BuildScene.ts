import Scene from "client/base/Scene";
import ToolbarWidget from "../widget/ToolbarWidget";

/** Construction mode scene */
export default class BuildScene extends Scene {
	private toolbarWidget: ToolbarWidget;

	constructor() {
		super();

		// Widgets
		this.toolbarWidget = this.addWidget(new ToolbarWidget());
	}

	hideScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.hideWidget(hasAnimations);
	}

	showScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.showWidget(hasAnimations);
	}
}
