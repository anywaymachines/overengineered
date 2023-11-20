import BuildScene from "client/gui/scene/BuildScene";

/** The controller of the scenes that are registered here */
export default class SceneController {
	// Scenes
	static buildScene: BuildScene = new BuildScene();

	static init() {}
}
