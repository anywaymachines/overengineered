import ComponentBase from "client/base/ComponentBase";
import ToolBase from "client/base/ToolBase";
import TooltipsControl from "client/gui/static/TooltipsControl";
import ObservableValue from "shared/event/ObservableValue";
import BuildTool from "../tools/BuildTool";
import ConfigTool from "../tools/ConfigTool";
import DeleteTool from "../tools/DeleteTool";
import MoveTool from "../tools/MoveTool";

export default class ToolController extends ComponentBase {
	public readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	public readonly tools: readonly ToolBase[];

	public readonly buildTool = new BuildTool();
	public readonly moveTool = new MoveTool();
	public readonly deleteTool = new DeleteTool();
	public readonly configTool = new ConfigTool();

	constructor() {
		super();

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.tools = [this.buildTool, this.moveTool, this.deleteTool, this.configTool] as const;
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
