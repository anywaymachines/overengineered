import Scene from "client/base/Scene";
import ToolBase from "client/base/ToolBase";
import ToolController from "client/tools/ToolController";
import GuiController from "client/controller/GuiController";
import Popup from "client/base/Popup";
import BuildToolScene, { BuildToolSceneDefinition } from "./BuildToolScene";
import DeleteToolScene, { DeleteToolSceneDefinition } from "./DeleteToolScene";
import ConfigToolScene, { ConfigToolSceneDefinition } from "./ConfigToolScene";
import { ActionBarControl, ActionBarControlDefinition } from "../static/ActionBarControl";
import ToolbarControl, { ToolbarControlDefinition } from "../controls/ToolbarControl";
import PlayerController from "client/controller/PlayerController";

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
	public static readonly instance = new BuildingModeScene(
		GuiController.getGameUI<{
			BuildingMode: BuildingModeSceneDefinition;
		}>().BuildingMode,
	);

	private readonly actionbar;
	private readonly toolbar;

	private readonly scenes = new Map<ToolBase, Scene>();
	private readonly popups: Popup[] = [];
	private currentScene?: Scene;
	private currentPopup?: Popup;
	private readonly hideWhenPopup: Scene[] = [];
	private readonly toBeVisible: Scene[] = [];

	constructor(gui: BuildingModeSceneDefinition) {
		super(gui);

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.hideWhenPopup.push(this.actionbar);
		this.actionbar.setVisible(true);

		this.toolbar = new ToolbarControl(gui.ToolbarGui);
		this.add(this.toolbar);
		this.hideWhenPopup.push(this.toolbar);
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

		this.scenes.forEach((scene) => {
			this.add(scene);
			this.hideWhenPopup.push(scene);
		});

		ToolController.selectedTool.subscribe((tool, prev) => {
			const newscene = tool && this.scenes.get(tool);
			const prevscene = prev && this.scenes.get(prev);

			if (tool === prev) return;

			prevscene?.hide();
			newscene?.show();
		}, true);
	}

	public registerPopup<TArgs extends unknown[]>(popup: Popup<GuiObject, TArgs>) {
		this.popups.push(popup);

		popup.onShow.Connect(() => {
			PlayerController.getPlayerModule().GetControls().Disable();

			this.currentPopup?.hide();
			this.currentPopup = popup;

			const tool = ToolController.selectedTool.get();
			this.currentScene = tool && this.scenes.get(tool);
			this.currentScene?.hide();

			this.toBeVisible.clear();
			this.hideWhenPopup.forEach((control) => {
				if (control.isVisible()) {
					this.toBeVisible.push(control);
				}

				control.hide();
			});
		});
		popup.onHide.Connect(() => {
			PlayerController.getPlayerModule().GetControls().Enable();
			this.currentPopup = undefined;
			this.currentScene?.show();

			const selectedTool = ToolController.selectedTool.get();
			if (selectedTool) {
				this.scenes.get(selectedTool)?.show();
			}

			this.toBeVisible.forEach((control) => control.show());
		});
	}
}
