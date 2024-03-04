import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import TooltipsControl from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import BuildTool from "client/tools/BuildTool";
import BuildTool2 from "client/tools/BuildTool2";
import ConfigTool from "client/tools/ConfigTool";
import DeleteTool from "client/tools/DeleteTool";
import MoveTool from "client/tools/MoveTool";
import PaintTool from "client/tools/PaintTool";
import ToolBase from "client/tools/ToolBase";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import EditTool from "./EditTool";
import { WireTool } from "./WireTool";

export default class ToolController extends ClientComponent {
	readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	readonly tools: readonly ToolBase[];

	readonly buildTool;
	readonly moveTool;
	readonly editTool;
	readonly deleteTool;
	readonly configTool;
	readonly paintTool;
	readonly buildTool2;
	readonly wiretool;

	constructor(mode: BuildingMode) {
		super();

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.buildTool = new BuildTool(mode);
		this.moveTool = new MoveTool(mode);
		this.editTool = new EditTool(mode);
		this.deleteTool = new DeleteTool(mode);
		this.configTool = new ConfigTool(mode);
		this.paintTool = new PaintTool(mode);
		this.buildTool2 = new BuildTool2(mode);
		this.wiretool = new WireTool(mode);

		const tools: ToolBase[] = [
			this.buildTool,
			this.moveTool,
			this.deleteTool,
			this.configTool,
			this.paintTool,
			this.wiretool,
			this.editTool,
		];
		if ((true as boolean) || GameDefinitions.isAdmin(Players.LocalPlayer)) {
			tools.insert(6, this.buildTool2);
		}

		this.tools = tools;
		this.selectedTool.subscribe((tool) => TooltipsControl.instance.updateControlTooltips(tool));
		this.event.onPrepare(() => TooltipsControl.instance.updateControlTooltips(this.selectedTool.get()));
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.tools];
	}

	enable() {
		super.enable();
		TooltipsControl.instance.updateControlTooltips(this.selectedTool.get());
	}
	disable() {
		super.disable();
		TooltipsControl.instance.updateControlTooltips(undefined);
	}
}
