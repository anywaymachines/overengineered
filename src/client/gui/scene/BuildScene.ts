import Scene from "client/base/Scene";
import ToolbarWidget from "../widget/ToolbarWidget";
import GuiController from "client/controller/GuiController";

/** Construction mode scene */
export default class BuildScene extends Scene {
	private toolbarWidget: ToolbarWidget;

	constructor() {
		super();

		// Widgets
		const gameUI = GuiController.getGameUI();
		this.toolbarWidget = this.addWidget(new ToolbarWidget(gameUI.ToolbarGui));
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
