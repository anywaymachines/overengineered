import ComponentBase from "client/component/ComponentBase";
import TooltipsControl from "client/gui/static/TooltipsControl";
import BuildTool2 from "client/tools/BuildTool2";
import PaintTool from "client/tools/PaintTool";
import ToolBase from "client/tools/ToolBase";
import WireTool from "client/tools/WireTool";
import ObservableValue from "shared/event/ObservableValue";
import BuildingMode from "../modes/build/BuildingMode";
import BuildTool from "./BuildTool";
import ConfigTool from "./ConfigTool";
import DeleteTool from "./DeleteTool";
import MoveTool from "./MoveTool";

export default class ToolController extends ComponentBase {
	public readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	public readonly tools: readonly ToolBase[];

	public readonly buildTool;
	public readonly moveTool;
	public readonly deleteTool;
	public readonly configTool;
	public readonly paintTool;
	public readonly buildTool2;
	public readonly wiretool;

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
			this.buildTool2,
		];

		this.tools = tools;
		this.selectedTool.subscribe((tool) => TooltipsControl.instance.updateControlTooltips(tool));
		this.event.onPrepare(() => TooltipsControl.instance.updateControlTooltips(this.selectedTool.get()));
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
