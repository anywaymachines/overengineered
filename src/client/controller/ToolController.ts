import ToolBase from "client/base/ToolBase";
import BuildTool from "../tools/BuildTool";
import ConfigTool from "../tools/ConfigTool";
import DeleteTool from "../tools/DeleteTool";
import MoveTool from "../tools/MoveTool";
import ObservableValue from "shared/event/ObservableValue";
import Signals from "client/event/Signals";
import ComponentBase from "client/base/ComponentBase";
import TooltipsControl from "client/gui/static/TooltipsControl";

export default class ToolController extends ComponentBase {
	public readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	public readonly tools: ToolBase[] = [];

	public readonly buildTool = new BuildTool();
	public readonly moveTool = new MoveTool();
	public readonly deleteTool = new DeleteTool();
	public readonly configTool = new ConfigTool();

	constructor() {
		super();

		this.selectedTool.subscribe((tool, prev) => {
			if (prev) Signals.TOOL.UNEQUIPPED.Fire(prev);
			if (tool) Signals.TOOL.EQUIPPED.Fire(tool);

			prev?.disable();
			tool?.enable();
		});

		this.tools.push(this.buildTool);
		this.tools.push(this.moveTool);
		this.tools.push(this.deleteTool);
		this.tools.push(this.configTool);

		this.selectedTool.subscribe((tool) => TooltipsControl.instance.updateControlTooltips(tool), true);
	}
}
