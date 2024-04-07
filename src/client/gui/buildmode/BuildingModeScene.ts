import { LoadingController } from "client/controller/LoadingController";
import { Control } from "client/gui/Control";
import { ToolbarControl, ToolbarControlDefinition } from "client/gui/buildmode/ToolbarControl";
import { BuildToolScene, BuildToolSceneDefinition } from "client/gui/buildmode/tools/BuildToolScene";
import { ConfigToolScene, ConfigToolSceneDefinition } from "client/gui/buildmode/tools/ConfigToolScene";
import { DeleteToolScene, DeleteToolSceneDefinition } from "client/gui/buildmode/tools/DeleteToolScene";
import { PaintToolScene, PaintToolSceneDefinition } from "client/gui/buildmode/tools/PaintToolScene";
import { ButtonControl } from "client/gui/controls/Button";
import { SavePopup } from "client/gui/popup/SavePopup";
import { SettingsPopup } from "client/gui/popup/SettingsPopup";
import { requestMode } from "client/modes/PlayModeRequest";
import { ActionController } from "client/modes/build/ActionController";
import { ToolBase } from "client/tools/ToolBase";
import { ToolController } from "client/tools/ToolController";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import { TransformProps } from "shared/component/Transform";
import { WireToolScene, WireToolSceneDefinition } from "./tools/WireToolScene";

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
	readonly Tools: Folder & {
		readonly Build: BuildToolSceneDefinition;
		readonly Delete: DeleteToolSceneDefinition;
		readonly Config: ConfigToolSceneDefinition;
		readonly Paint: PaintToolSceneDefinition;
		readonly Wire: WireToolSceneDefinition;
	};
};
export class BuildingModeScene extends Control<BuildingModeSceneDefinition> {
	private readonly scenes = new ComponentKeyedChildren<ToolBase, Control>(this);

	constructor(gui: BuildingModeSceneDefinition, tools: ToolController) {
		super(gui);

		this.add(ActionController.instance);

		const actionbar = this.add(new ActionBarControl(gui.ActionBar));
		const updateActionBarVisibility = () =>
			actionbar.setVisible(!tools.selectedTool.get() && !LoadingController.isLoading.get());

		this.event.subscribeObservable(LoadingController.isLoading, updateActionBarVisibility);
		this.event.subscribeObservable(tools.selectedTool, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		const toolbar = this.add(new ToolbarControl(tools, gui.Hotbar));
		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);

		const types = [
			[tools.buildTool, BuildToolScene, this.gui.Tools.Build],
			[tools.deleteTool, DeleteToolScene, this.gui.Tools.Delete],
			[tools.configTool, ConfigToolScene, this.gui.Tools.Config],
			[tools.paintTool, PaintToolScene, this.gui.Tools.Paint],
			[tools.wireTool, WireToolScene, this.gui.Tools.Wire],
		] as const;
		for (const [tool, scenetype, scenegui] of types) {
			this.scenes.add(tool, new scenetype(scenegui as never, tool as never));
		}

		const selectedToolUpdated = (tool: ToolBase | undefined) => {
			for (const [, scene] of this.scenes.getAll()) {
				scene.hide();
			}

			(tool && this.scenes.get(tool))?.show();
		};

		this.event.subscribeObservable(tools.tools, () => selectedToolUpdated(tools.selectedTool.get()), true);
		tools.selectedTool.subscribe(selectedToolUpdated, true);
	}
}
