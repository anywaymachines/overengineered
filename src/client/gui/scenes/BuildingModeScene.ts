import Control from "client/base/Control";
import ToolBase from "client/base/ToolBase";
import ToolController from "client/tools/ToolController";
import BuildToolScene, { BuildToolSceneDefinition } from "./BuildToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./DeleteToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "./ConfigToolScene";
import ToolbarControl, { ToolbarControlDefinition } from "../controls/ToolbarControl";
import Signals from "client/event/Signals";
import GuiAnimator from "../GuiAnimator";
import Remotes from "shared/Remotes";

type ActionBarControlDefinition = GuiObject & {
	Buttons: {
		Run: GuiButton;
		Save: GuiButton;
		Settings: GuiButton;
	};
};
class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		this.event.subscribe(this.gui.Buttons.Run.Activated, async () => {
			await Remotes.Client.GetNamespace("Ride").Get("RideStartRequest").CallServerAsync();
			Signals.PLAY_MODE.set("ride");
		});
	}
}

export type BuildingModeSceneDefinition = GuiObject & {
	ActionBarGui: ActionBarControlDefinition;
	ToolbarGui: ToolbarControlDefinition;
	Tools: {
		BuildToolGui: BuildToolSceneDefinition;
		DeleteToolGui: DeleteToolSceneDefinition;
		ConfigToolGui: ConfigToolSceneDefinition;
	};
};
export default class BuildingModeScene extends Control<BuildingModeSceneDefinition> {
	private readonly actionbar;
	private readonly toolbar;

	private readonly scenes = new Map<ToolBase, Control>();

	constructor(gui: BuildingModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();

		this.event.subscribeObservable(
			ToolController.selectedTool,
			(tool) => {
				if (tool) {
					this.actionbar.hide();
				} else {
					this.actionbar.show();
					GuiAnimator.transition(this.gui, 0.2, "down");
				}
			},
			true,
		);

		this.toolbar = new ToolbarControl(gui.ToolbarGui);
		this.add(this.toolbar);
		this.toolbar.show();

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
