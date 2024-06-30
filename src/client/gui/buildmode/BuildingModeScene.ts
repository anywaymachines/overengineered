import { LoadingController } from "client/controller/LoadingController";
import { ToolbarControl } from "client/gui/buildmode/ToolbarControl";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { TouchActionControllerGui } from "client/gui/TouchActionControllerGui";
import { ActionController } from "client/modes/build/ActionController";
import { requestMode } from "client/modes/PlayModeRequest";
import { ComponentDisabler } from "shared/component/ComponentDisabler";
import type { ToolbarControlDefinition } from "client/gui/buildmode/ToolbarControl";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { TouchActionControllerGuiDefinition } from "client/gui/TouchActionControllerGui";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TransformProps } from "shared/component/Transform";

type ActionBarControlDefinition = GuiObject & {
	Buttons: {
		Run: GuiButton;
		Save: GuiButton;
		Settings: GuiButton;
	};
};
class ActionBarControl extends Control<ActionBarControlDefinition> {
	readonly allButtons = ["run", "save", "settings"] as const;
	readonly enabledButtons = new ComponentDisabler(this.allButtons);

	constructor(gui: ActionBarControlDefinition, di: DIContainer) {
		super(gui);

		const runButton = this.add(new ButtonControl(this.gui.Buttons.Run));
		const saveButton = this.add(new ButtonControl(this.gui.Buttons.Save));
		const settingsButton = this.add(new ButtonControl(this.gui.Buttons.Settings));

		this.event.subscribeObservable(
			this.enabledButtons.enabled,
			(enabled) => {
				runButton.setVisible(enabled.includes("run"));
				saveButton.setVisible(enabled.includes("save"));
				settingsButton.setVisible(enabled.includes("settings"));
			},
			true,
		);

		this.event.subscribe(runButton.activated, () => requestMode("ride"));
		this.event.subscribe(saveButton.activated, () => di.resolve<SavePopup>().show());
		this.event.subscribe(settingsButton.activated, () => di.resolve<SettingsPopup>().show());
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
	readonly Action: TouchActionControllerGuiDefinition;
	readonly ActionBar: ActionBarControlDefinition;
	readonly Hotbar: ToolbarControlDefinition;
};
export class BuildingModeScene extends Control<BuildingModeSceneDefinition> {
	readonly actionbar;

	constructor(gui: BuildingModeSceneDefinition, mode: BuildingMode, tools: ToolController, di: DIContainer) {
		super(gui);

		this.add(ActionController.instance);
		this.add(new TouchActionControllerGui(gui.Action, mode.gridEnabled, mode.editMode));

		this.actionbar = this.add(new ActionBarControl(gui.ActionBar, di));
		const updateActionBarVisibility = () =>
			this.actionbar.setVisible(!tools.selectedTool.get() && !LoadingController.isLoading.get());

		this.event.subscribeObservable(LoadingController.isLoading, updateActionBarVisibility);
		this.event.subscribeObservable(tools.selectedTool, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		const toolbar = this.add(new ToolbarControl(tools, gui.Hotbar));
		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);
	}
}
