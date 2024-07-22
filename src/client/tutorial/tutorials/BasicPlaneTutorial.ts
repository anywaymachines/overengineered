import { ActionController } from "client/modes/build/ActionController";
import { BasicPlaneTutorialDiff } from "client/tutorial/tutorials/BasicPlaneTutorial.diff";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class BasicPlaneTutorial implements TutorialDescriber {
	readonly name = "Baisc plane";

	constructor(@inject private readonly buildingMode: BuildingMode) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { diffs, saveVersion } = BasicPlaneTutorialDiff;
		const toolController = this.buildingMode.toolController;
		const editTool = toolController.allTools.editTool;

		return [
			() => [
				t.funcPart(() => {
					ActionController.instance.disable();
					this.buildingMode.gui.actionbar.enabledButtons.enableOnly("settings");

					t.onDestroy(() => {
						ActionController.instance.enable();
						toolController.enabledTools.enableAll();
						this.buildingMode.gui.actionbar.enabledButtons.enableAll();
						editTool.enabledModes.enableAll();
					});
				}),
				t.partNextButton(),
				t.partText("welcome, this will teach you how plane."),
			],

			() => [t.processDiff(diffs.d0, saveVersion), t.partText("buid the plane."), t.hintsPart("engineers")],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("this a plane. good luck"),
				t.hintsPart("Important tip: This is not a car"),
			],
		];
	}
}
