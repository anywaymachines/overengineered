import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import ToolbarControl, { ToolbarControlDefinition } from "client/gui/buildmode/ToolbarControl";
import BuildTool2Scene, { BuildTool2SceneDefinition } from "client/gui/buildmode/tools/BuildTool2Scene";
import BuildToolScene, { BuildToolSceneDefinition } from "client/gui/buildmode/tools/BuildToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "client/gui/buildmode/tools/ConfigToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "client/gui/buildmode/tools/DeleteToolScene";
import PaintToolScene, { PaintToolSceneDefinition } from "client/gui/buildmode/tools/PaintToolScene";
import { ButtonControl } from "client/gui/controls/Button";
import SavePopup from "client/gui/popup/SavePopup";
import SettingsPopup from "client/gui/popup/SettingsPopup";
import { requestMode } from "client/modes/PlayModeRequest";
import ActionController from "client/modes/build/ActionController";
import ToolBase from "client/tools/ToolBase";
import ToolController from "client/tools/ToolController";
import WireToolScene, { WireToolSceneDefinition } from "./tools/WireToolScene";

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
			SavePopup.showPopup();
		});

		this.event.subscribe(settingsButton.activated, async () => {
			SettingsPopup.showPopup();
		});
	}
}

export type BuildingModeSceneDefinition = GuiObject & {
	readonly ActionBar: ActionBarControlDefinition;
	readonly Hotbar: ToolbarControlDefinition;
	readonly Tools: {
		readonly Build: BuildToolSceneDefinition;
		readonly Build2: BuildTool2SceneDefinition;
		readonly Delete: DeleteToolSceneDefinition;
		readonly Config: ConfigToolSceneDefinition;
		readonly Paint: PaintToolSceneDefinition;
		readonly Wire: WireToolSceneDefinition;
	};
};
export default class BuildingModeScene extends Control<BuildingModeSceneDefinition> {
	private readonly actionbar;
	private readonly toolbar;

	private readonly scenes = new Map<ToolBase, Control>();

	constructor(gui: BuildingModeSceneDefinition, tools: ToolController) {
		super(gui);

		this.add(ActionController.instance);

		this.actionbar = new ActionBarControl(gui.ActionBar);
		this.add(this.actionbar);
		this.actionbar.show();

		this.event.subscribeObservable(
			tools.selectedTool,
			(tool) => {
				if (tool) {
					this.actionbar.hide();
				} else {
					this.actionbar.show();
					GuiAnimator.transition(this.gui.ActionBar, 0.2, "down");
				}
			},
			true,
		);

		this.toolbar = new ToolbarControl(tools, gui.Hotbar);
		this.add(this.toolbar);

		this.scenes.set(tools.buildTool, new BuildToolScene(this.gui.Tools.Build, tools.buildTool));
		this.scenes.set(tools.deleteTool, new DeleteToolScene(this.gui.Tools.Delete, tools.deleteTool));
		this.scenes.set(tools.configTool, new ConfigToolScene(this.gui.Tools.Config, tools.configTool));
		this.scenes.set(tools.paintTool, new PaintToolScene(this.gui.Tools.Paint, tools.paintTool));
		this.scenes.set(tools.buildTool2, new BuildTool2Scene(this.gui.Tools.Build2, tools.buildTool2));
		this.scenes.set(tools.wiretool, new WireToolScene(this.gui.Tools.Wire, tools.wiretool));

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
