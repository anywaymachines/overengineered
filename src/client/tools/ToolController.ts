import ToolBase from "client/base/ToolBase";
import BuildTool from "./BuildTool";
import ConfigTool from "./ConfigTool";
import DeleteTool from "./DeleteTool";
import MoveTool from "./MoveTool";
import ObservableValue from "shared/event/ObservableValue";
import Signals from "client/event/Signals";

export default class ToolController {
	public static readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	public static readonly tools: ToolBase[] = [];

	public static readonly buildTool = new BuildTool();
	public static readonly moveTool = new MoveTool();
	public static readonly deleteTool = new DeleteTool();
	public static readonly configTool = new ConfigTool();

	static {
		ToolController.selectedTool.subscribe((tool, prev) => {
			if (prev) Signals.TOOL.UNEQUIPPED.Fire(prev);
			if (tool) Signals.TOOL.EQUIPPED.Fire(tool);

			prev?.deactivate();
			tool?.activate();
		});

		this.tools.push(this.buildTool);
		this.tools.push(this.moveTool);
		this.tools.push(this.deleteTool);
		this.tools.push(this.configTool);
	}
}
