import BuildScene from "client/gui/scene/BuildScene";

export default class SceneController {
	static buildScene: BuildScene = new BuildScene();

	static init() {
		this.buildScene.showScene(true);
	}
}
