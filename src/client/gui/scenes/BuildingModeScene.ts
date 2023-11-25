import Scene from "client/base/Scene";
import ToolBase from "client/base/ToolBase";
import ToolController from "client/tools/ToolController";
import BuildToolScene, { BuildToolSceneDefinition } from "./BuildToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./DeleteToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "./ConfigToolScene";
import { ActionBarControl, ActionBarControlDefinition } from "../static/ActionBarControl";
import ToolbarControl, { ToolbarControlDefinition } from "../controls/ToolbarControl";

export type BuildingModeSceneDefinition = Folder & {
	ActionBarGui: ActionBarControlDefinition;
	ToolbarGui: ToolbarControlDefinition;
	Tools: {
		BuildToolGui: BuildToolSceneDefinition;
		DeleteToolGui: DeleteToolSceneDefinition;
		ConfigToolGui: ConfigToolSceneDefinition;
	};
};

export default class BuildingModeScene extends Scene<BuildingModeSceneDefinition> {
	private readonly actionbar;
	private readonly toolbar;

	private readonly scenes = new Map<ToolBase, Scene>();

	constructor(gui: BuildingModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.setVisible(true);

		this.toolbar = new ToolbarControl(gui.ToolbarGui);
		this.add(this.toolbar);
		this.toolbar.setVisible(true);

		this.scenes.set(
			ToolController.buildTool,
			new BuildToolScene(this.gui.Tools.BuildToolGui, ToolController.buildTool),
		);
		this.scenes.set(
			ToolController.deleteTool,
			new DeleteToolScene(this.gui.Tools.DeleteToolGui, ToolController.deleteTool),
		);
		this.scenes.set(
			ToolController.configTool,
			new ConfigToolScene(this.gui.Tools.ConfigToolGui, ToolController.configTool),
		);

		this.scenes.forEach((scene) => this.add(scene));

		ToolController.selectedTool.subscribe((tool, prev) => {
			const newscene = tool && this.scenes.get(tool);
			const prevscene = prev && this.scenes.get(prev);

			if (tool === prev) return;

			prevscene?.hide();
			newscene?.show();
		}, true);
	}
}
