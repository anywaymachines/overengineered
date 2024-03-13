import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import BuildingMode from "client/modes/build/BuildingMode";
import BuildTool from "client/tools/BuildTool";
import BuildTool2 from "client/tools/BuildTool2";
import ConfigTool from "client/tools/ConfigTool";
import DeleteTool from "client/tools/DeleteTool";
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
	readonly editTool;
	readonly deleteTool;
	readonly configTool;
	readonly paintTool;
	readonly buildTool2;
	readonly wiretool;

	constructor(mode: BuildingMode) {
		super();

		Signals.PLAYER.DIED.Connect(() => {
			this.selectedTool.set(undefined);
		});

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.buildTool = new BuildTool(mode);
		this.editTool = new EditTool(mode);
		this.deleteTool = new DeleteTool(mode);
		this.configTool = new ConfigTool(mode);
		this.paintTool = new PaintTool(mode);
		this.buildTool2 = new BuildTool2(mode);
		this.wiretool = new WireTool(mode);

		const tools: ToolBase[] = [
			this.buildTool,
			this.editTool,
			this.deleteTool,
			this.configTool,
			this.paintTool,
			this.wiretool,
		];
		if ((true as boolean) || GameDefinitions.isAdmin(Players.LocalPlayer)) {
			tools.insert(6, this.buildTool2);
		}

		this.tools = tools;
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.tools];
	}
}
