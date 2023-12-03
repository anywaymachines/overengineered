import PlaymodeSceneController, { MainDefinition } from "./PlaymodeSceneController";
import ComponentContainer from "./base/ComponentContainer";
import GuiController from "./controller/GuiController";

export const startGame = () => {
	const root = new ComponentContainer();

	const sceneController = new PlaymodeSceneController(GuiController.getGameUI<MainDefinition>());
	root.add(sceneController);

	root.enable();
	return root;
};
