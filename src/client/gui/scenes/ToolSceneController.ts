import Scene from "client/base/Scene";
import ToolBase from "client/base/ToolBase";
import ToolController from "client/tools/ToolController";
import BuildToolScene, { BuildToolSceneDefinition } from "./BuildToolScene";
import GuiController from "client/controller/GuiController";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./DeleteToolScene";

export default class ToolSceneController {
	private static readonly scenes = new Map<ToolBase, Scene>();

	public static init() {
		const gameui = GuiController.getGameUI<{
			BuildingMode: {
				Tools: { BuildToolGui: BuildToolSceneDefinition; DeleteToolGui: DeleteToolSceneDefinition };
			};
		}>();

		this.scenes.set(
			ToolController.buildTool,
			new BuildToolScene(gameui.BuildingMode.Tools.BuildToolGui, ToolController.buildTool),
		);
		this.scenes.set(
			ToolController.deleteTool,
			new DeleteToolScene(gameui.BuildingMode.Tools.DeleteToolGui, ToolController.deleteTool),
		);

		ToolController.selectedTool.subscribe((tool, prev) => {
			const newscene = tool && this.scenes.get(tool);
			const prevscene = prev && this.scenes.get(prev);

			if (tool === prev) return;

			prevscene?.hide();
			newscene?.show();
		}, true);
	}
}
