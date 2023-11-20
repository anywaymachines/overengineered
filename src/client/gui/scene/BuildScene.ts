import Scene from "client/base/Scene";
import ToolbarWidget from "../widget/ToolbarWidget";
import Signals from "client/event/Signals";
import EventHandler from "client/event/EventHandler";

/** Construction mode scene */
export default class BuildScene extends Scene {
	private readonly eventHandler = new EventHandler();
	private readonly toolbarWidget: ToolbarWidget;

	constructor() {
		super();

		// Widgets
		this.toolbarWidget = this.addWidget(new ToolbarWidget());

		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => this.hideScene(true));
		this.eventHandler.subscribe(Signals.PLAYER.SPAWN, () => this.showScene(true));
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
