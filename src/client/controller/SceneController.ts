import EventHandler from "client/event/EventHandler";
import Signals from "client/event/Signals";
import BuildScene from "client/gui/scene/BuildScene";

/** The controller of the scenes that are registered here */
export default class SceneController {
	// Events
	static eventHandler: EventHandler = new EventHandler();

	// Scenes
	static buildScene: BuildScene = new BuildScene();

	static init() {
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => this.onPlayerDied());
		this.eventHandler.subscribe(Signals.PLAYER.SPAWN, () => this.onPlayerSpawn());
	}

	static onPlayerDied() {
		this.buildScene.hideScene(true);
	}

	static onPlayerSpawn() {
		this.buildScene.showScene(true);
	}
}
