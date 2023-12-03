import Control from "client/base/Control";
import ToolBase from "client/base/ToolBase";
import ToolController from "client/controller/ToolController";
import BuildToolScene, { BuildToolSceneDefinition } from "./BuildToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./DeleteToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "./ConfigToolScene";
import ToolbarControl, { ToolbarControlDefinition } from "./ToolbarControl";
import GuiAnimator from "../GuiAnimator";
import SavePopup from "../popup/SavePopup";
import PlayModeController from "client/controller/PlayModeController";
import { ButtonControl } from "../controls/Button";

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

		const runButton = this.added(new ButtonControl(this.gui.Buttons.Run));
		const saveButton = this.added(new ButtonControl(this.gui.Buttons.Save));
		const settingsButton = this.added(new ButtonControl(this.gui.Buttons.Settings));

		this.event.subscribe(runButton.activated, async () => {
			await PlayModeController.instance.requestMode("ride");
		});

		this.event.subscribe(saveButton.activated, async () => {
			SavePopup.instance.show();
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
					GuiAnimator.transition(this.gui.ActionBarGui, 0.2, "down");
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
