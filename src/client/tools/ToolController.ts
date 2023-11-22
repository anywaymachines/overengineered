import ToolBase from "client/base/ToolBase";
import BuildToolWidget from "client/gui/widget/tools/BuildToolWidget";
import ConfigToolWidget from "client/gui/widget/tools/ConfigToolWidget";
import DeleteToolWidget from "client/gui/widget/tools/DeleteToolWidget";
import ToolWidget from "client/gui/widget/tools/ToolWidget";
import BuildTool from "./BuildTool";
import ConfigTool from "./ConfigTool";
import DeleteTool from "./DeleteTool";
import MoveTool from "./MoveTool";
import ObservableValue from "shared/event/ObservableValue";
import Signals from "client/event/Signals";

export default class ToolController {
	public static readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);

	public static readonly tools: ToolBase[] = [];
	public static readonly toolWidgets: ToolWidget<ToolBase>[] = [];

	public static init() {
		ToolController.selectedTool.subscribe(undefined, (tool, prev) => {
			if (prev) Signals.TOOL.UNEQUIPPED.Fire(prev);
			if (tool) Signals.TOOL.EQUIPPED.Fire(tool);

			prev?.deactivate();
			tool?.activate();
		});

		const addTool = <TTool extends ToolBase>(tool: TTool, widgetfunc?: (tool: TTool) => ToolWidget<TTool>) => {
			this.tools.push(tool);
			if (widgetfunc) this.toolWidgets.push(widgetfunc(tool));
		};

		addTool(new BuildTool() /*, (tool) => new BuildToolWidget(tool)*/);
		/*addTool(new MoveTool());
		addTool(new DeleteTool(), (tool) => new DeleteToolWidget(tool));
		addTool(new ConfigTool(), (tool) => new ConfigToolWidget(tool));*/
	}
}
