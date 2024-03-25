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
import BuildTool from "client/tools/BuildTool";
import BuildTool2 from "client/tools/BuildTool2";
import ConfigTool from "client/tools/ConfigTool";
import DeleteTool from "client/tools/DeleteTool";
import PaintTool from "client/tools/PaintTool";
import ToolBase from "client/tools/ToolBase";
import ToolController from "client/tools/ToolController";
import { WireTool } from "client/tools/WireTool";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
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
	private readonly scenes = new ComponentKeyedChildren<ToolBase, Control>(this);

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

		const types = [
			[BuildTool, BuildToolScene, this.gui.Tools.Build],
			[DeleteTool, DeleteToolScene, this.gui.Tools.Delete],
			[ConfigTool, ConfigToolScene, this.gui.Tools.Config],
			[PaintTool, PaintToolScene, this.gui.Tools.Paint],
			[BuildTool2, BuildTool2Scene, this.gui.Tools.Build2],
			[WireTool, WireToolScene, this.gui.Tools.Wire],
		] as const;

		const selectedToolUpdated = (tool: ToolBase | undefined) => {
			for (const [, scene] of this.scenes.getAll()) {
				scene.hide();
			}

			(tool && this.scenes.get(tool))?.show();
		};

		this.event.subscribeObservable2(
			tools.tools,
			(toollist) => {
				this.scenes.clear();

				for (const tool of toollist) {
					for (const [tooltype, scenetype, scenegui] of types) {
						if (!(tool instanceof tooltype)) {
							continue;
						}

						const gui = scenegui.Clone();
						gui.Parent = scenegui.Parent;
						this.scenes.add(tool, new scenetype(gui as never, tool as never));
					}
				}

				selectedToolUpdated(tools.selectedTool.get());
			},
			true,
		);

		tools.selectedTool.subscribe(selectedToolUpdated, true);
	}
}
