import { InputController } from "client/controller/InputController";
import { ActionController } from "client/modes/build/ActionController";
import { TestTutorialDiff } from "client/tutorial/tutorials/TestTutorial.diff";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class TestTutorial implements TutorialDescriber {
	readonly name = "Test tutorial";

	constructor(@inject private readonly buildingMode: BuildingMode) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { diffs, saveVersion } = TestTutorialDiff;
		const toolController = this.buildingMode.toolController;
		const editTool = toolController.allTools.editTool;

		return [
			() => [
				t.funcPart(() => {
					ActionController.instance.disable();
					toolController.enabledTools.disableAll();
					this.buildingMode.gui.actionbar.enabledButtons.enableOnly("settings");

					t.onDestroy(() => {
						ActionController.instance.enable();
						toolController.enabledTools.enableAll();
						this.buildingMode.gui.actionbar.enabledButtons.enableAll();
						editTool.enabledModes.enableAll();
					});
				}),
				t.partNextButton(),
				t.partText("Welcome to Plane Engineers!\nThis tutorial will teach you the basics of the game."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.d0buildFrame, saveVersion),
				t.partText("First, let's build the frame for our car."),
				t.tasksPart(
					"Select one",
					"Select 'blocks'",
					"Select BLOCK",
					"BLOCK IS COMING",
					"             HIDE",
					"",
					"hint: hold shift to build multiple",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.deleteTool)),
				t.processDiff(diffs.d1deleteBlock, saveVersion),
				t.partText("Whoops, we placed one block too many. Delete it."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.d2placeServos, saveVersion),
				t.partText("Now place the rotators for rotatoring."),
				t.tasksPart(
					`Hint: You can press ${(() => {
						const it = InputController.inputType.get();
						if (it === "Desktop") return "the middle mouse button";
						if (it === "Touch") return "the pipette button on the inventory";
						return "idk something gamepad button";
					})()} to copy the block`,
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.d3placeSeat, saveVersion),
				t.partText("seat place or vehicl no work"),
			],

			() => [
				t.funcPart(() =>
					toolController.enabledTools.enableOnly(
						toolController.allTools.buildTool,
						toolController.allTools.deleteTool,
					),
				),
				t.processDiff(diffs.d4prtest, saveVersion),
				t.partText("Now delete and place for TESTING mega TESTING."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.d5cfgtest, saveVersion),
				t.partText("Now change the motor config to +W -S !!!!!!!!!!important"),
				t.tasksPart(
					"Select 4 config tool",
					"Select the blockl",
					"Select +",
					"select W",
					"             select -",
					"select S",
					"profit",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("You are now the maks gaming of plane engineers."),
				t.tasksPart("Important tip: This is a car"),
			],
		];
	}
}
