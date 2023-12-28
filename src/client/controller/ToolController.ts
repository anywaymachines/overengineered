import { Players } from "@rbxts/services";
import ComponentBase from "client/base/ComponentBase";
import ToolBase from "client/base/ToolBase";
import TooltipsControl from "client/gui/static/TooltipsControl";
import BuildTool2 from "client/tools/BuildTool2";
import GameDefinitions from "shared/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import BuildTool from "../tools/BuildTool";
import ConfigTool from "../tools/ConfigTool";
import DeleteTool from "../tools/DeleteTool";
import MoveTool from "../tools/MoveTool";
import BuildingMode from "./modes/BuildingMode";

export default class ToolController extends ComponentBase {
	public readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	public readonly tools: readonly ToolBase[];

	public readonly buildTool;
	public readonly moveTool;
	public readonly deleteTool;
	public readonly configTool;
	public readonly buildTool2;

	constructor(mode: BuildingMode) {
		super();

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.buildTool = new BuildTool(mode);
		this.moveTool = new MoveTool(mode);
		this.deleteTool = new DeleteTool(mode);
		this.configTool = new ConfigTool(mode);
		this.buildTool2 = new BuildTool2(mode);

		const tools: ToolBase[] = [this.buildTool, this.moveTool, this.deleteTool, this.configTool];
		if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
			tools.push(this.buildTool2);
		}

		this.tools = tools;
		this.selectedTool.subscribe((tool) => TooltipsControl.instance.updateControlTooltips(tool));
		this.event.onPrepare(() => TooltipsControl.instance.updateControlTooltips(this.selectedTool.get()), true);
	}

	public enable() {
		super.enable();
		TooltipsControl.instance.updateControlTooltips(this.selectedTool.get());
	}
	public disable() {
		super.disable();
		TooltipsControl.instance.updateControlTooltips(undefined);
	}
}
