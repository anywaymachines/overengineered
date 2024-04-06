import { BuildingMode } from "client/modes/build/BuildingMode";
import { Tutorial } from "client/tutorial/Tutorial";

export type TutorialMoveAssemblyBlockHighlight = {
	position: Vector3;
};

export class TutorialEditTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.editTool;
	}

	addAssemblyToMove(data: TutorialMoveAssemblyBlockHighlight) {
		// TODO:
	}
}
