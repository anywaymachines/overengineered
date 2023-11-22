import Scene from "client/base/Scene";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";

/** Construction mode scene */
export default class BuildScene extends Scene {
	private readonly eventHandler = new EventHandler();

	constructor() {
		super();
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => this.hideScene(true));
		this.eventHandler.subscribe(Signals.PLAYER.SPAWN, () => this.showScene(true));
	}

	hideScene(hasAnimations: boolean): void {}

	showScene(hasAnimations: boolean): void {}
}
