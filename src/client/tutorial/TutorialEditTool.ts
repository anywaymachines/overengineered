import { BuildingMode } from "client/modes/build/BuildingMode";
import { EditTool } from "client/tools/EditTool";
import { Tutorial } from "client/tutorial/Tutorial";

export class TutorialEditTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.editTool;
	}

	setPlotMoveOffset(data: Vector3) {
		EditTool.plotMoveOffset = data;
	}

	cleanup() {
		this.get().enabledModes.set(EditTool.allModes);

		EditTool.plotMoveOffset = Vector3.zero;
	}
}
