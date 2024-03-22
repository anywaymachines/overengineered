import { LoadingController } from "client/controller/LoadingController";
import Control from "client/gui/Control";
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
import { TransformProps } from "shared/component/Transform";
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

		const runButton = this.add(new ButtonControl(this.gui.Buttons.Run));
		const saveButton = this.add(new ButtonControl(this.gui.Buttons.Save));
		const settingsButton = this.add(new ButtonControl(this.gui.Buttons.Settings));

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

	show(): void {
		super.show();
		return;

		const params: TransformProps = {
			style: "Quad",
			direction: "Out",
			duration: 0.3,
		};
		this.transform((tr) => tr.moveY(new UDim(0, 10), params));
	}
	hide(): void {
		super.hide();
		return;

		const params: TransformProps = {
			style: "Quad",
			direction: "Out",
			duration: 0.3,
		};
		this.transform((tr) =>
			tr
				.moveY(new UDim(0, -80), params)
				.then()
				.func(() => super.hide()),
		);
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
	private readonly scenes = new Map<ToolBase, Control>();

	constructor(gui: BuildingModeSceneDefinition, tools: ToolController) {
		super(gui);

		this.add(ActionController.instance);

		const actionbar = this.add(new ActionBarControl(gui.ActionBar));
		const updateActionBarVisibility = () =>
			actionbar.setVisible(!tools.selectedTool.get() && !LoadingController.isLoading.get());

		this.event.subscribeObservable2(LoadingController.isLoading, updateActionBarVisibility);
		this.event.subscribeObservable2(tools.selectedTool, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		const toolbar = this.add(new ToolbarControl(tools, gui.Hotbar));
		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable2(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);

		this.scenes.set(tools.buildTool, new BuildToolScene(this.gui.Tools.Build, tools.buildTool));
		this.scenes.set(tools.deleteTool, new DeleteToolScene(this.gui.Tools.Delete, tools.deleteTool));
		this.scenes.set(tools.configTool, new ConfigToolScene(this.gui.Tools.Config, tools.configTool));
		this.scenes.set(tools.paintTool, new PaintToolScene(this.gui.Tools.Paint, tools.paintTool));
		this.scenes.set(tools.buildTool2, new BuildTool2Scene(this.gui.Tools.Build2, tools.buildTool2));
		this.scenes.set(tools.wireTool, new WireToolScene(this.gui.Tools.Wire, tools.wireTool));

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
