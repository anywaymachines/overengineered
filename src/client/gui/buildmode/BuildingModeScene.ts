import Control from "client/base/Control";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import ToolController from "client/controller/ToolController";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import GuiAnimator from "../GuiAnimator";
import { ButtonControl } from "../controls/Button";
import SavePopup from "../popup/SavePopup";
import SettingsPopup from "../popup/SettingsPopup";
import ToolbarControl, { ToolbarControlDefinition } from "./ToolbarControl";
import BuildTool2Scene from "./tools/BuildTool2Scene";
import BuildToolScene, { BuildToolSceneDefinition } from "./tools/BuildToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "./tools/ConfigToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./tools/DeleteToolScene";

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
			await requestMode("ride");
		});

		this.event.subscribe(saveButton.activated, async () => {
			SavePopup.instance.show();
		});

		this.event.subscribe(settingsButton.activated, async () => {
			SettingsPopup.instance.show();
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

	constructor(gui: BuildingModeSceneDefinition, tools: ToolController) {
		super(gui);

		this.add(ActionController.instance);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();

		this.event.subscribeObservable(
			tools.selectedTool,
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

		this.toolbar = new ToolbarControl(tools, gui.ToolbarGui);
		this.add(this.toolbar);
		this.toolbar.show();

		const bt2 = this.gui.Tools.BuildToolGui.Clone();
		bt2.Parent = this.gui.Tools.BuildToolGui.Parent;

		this.scenes.set(tools.buildTool, new BuildToolScene(this.gui.Tools.BuildToolGui, tools.buildTool));
		this.scenes.set(tools.deleteTool, new DeleteToolScene(this.gui.Tools.DeleteToolGui, tools.deleteTool));
		this.scenes.set(tools.configTool, new ConfigToolScene(this.gui.Tools.ConfigToolGui, tools.configTool));
		this.scenes.set(tools.buildTool2, new BuildTool2Scene(bt2, tools.buildTool2));

		this.scenes.forEach((scene) => this.add(scene));

		tools.selectedTool.subscribe((tool, prev) => {
			const newscene = tool && this.scenes.get(tool);
			const prevscene = prev && this.scenes.get(prev);

			if (tool === prev) return;

			prevscene?.hide();
			newscene?.show();
		}, true);
	}
}
