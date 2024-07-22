import { ActionController } from "client/modes/build/ActionController";
import { BasicCarTutorialDiffs } from "client/tutorial/tutorials/BasicCarTutorial.diff";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class BasicCarTutorial implements TutorialDescriber {
	readonly name = "Basics/car";

	constructor(@inject private readonly buildingMode: BuildingMode) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { saveVersion, diffs } = BasicCarTutorialDiffs;
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
				t.partText(
					"Welcome to",
					" ",
					"Plane Engineers",
					"!",
					"\n",
					"This tutorial will teach you the basics of the game.",
				),
				t.translatedTasksPart([`Hint: Press "next" to advance`]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c1frame, saveVersion),
				t.partText("First, let's build the frame for our car."),
				t.translatedTasksPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Block"`],
					["Place all the highlighted blocks"],
					[""],
					["Hint: Hold shift to build multiple blocks"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.deleteTool)),
				t.processDiff(diffs.c2delete, saveVersion),
				t.partText("Whoops, we placed one block too many. Delete it."),
				t.translatedTasksPart(["Select the delete tool"]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.combinePartsParallel(
					t.processDiff(diffs.c3servo1, saveVersion),
					t.combinePartsSequential(
						() => t.processDiff(diffs.c3servo2, saveVersion),
						() => t.processDiff(diffs.c3servo3, saveVersion),
					),
				),
				t.partText("Next, you need to install servomotors. They need for the car to turn."),
				t.translatedTasksPart(
					["Select the build tool"],
					[`Select "Servo"`],
					["Place all the highlighted blocks"],
				),
			],

			() => [
				t.funcPart(() => {
					toolController.enabledTools.enableOnly(toolController.allTools.editTool);
					editTool.enabledModes.enableOnly("Move");
				}),
				t.processDiff(diffs.c4moveup, saveVersion),
				t.partText("Now we need to lift the car, so it will be easier for us to install the wheels and motors"),
				t.translatedTasksPart([
					"Select the edit tool",
					`Press "Select plot"`,
					`Press "Move"`,
					"Move the whole building up 4 times (2 blocks)",
				]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c5motor, saveVersion),
				t.partText("Great! Let's install motors that will turn the wheels and move the car!"),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c6wheels, saveVersion),
				t.partText("Nice, now you can install wheels"),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c7seat, saveVersion),
				t.partText("Now, the main peace - the vehicle seat."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c8cfgmotorsright, saveVersion),
				t.partText(
					"It's time to adjust the controls, let's start with the rotary mechanism. Configure the right side motors first.",
				),
				t.hintsPart(
					"Select the config tool",
					"Select right side motors",
					"Set Rotation+ to key W",
					"Set Rotation- to key S",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c9cfgmotorsleft, saveVersion),
				t.partText(
					"Great! Now configure the left side motors of your car. Configure them like the right side, but inversed",
				),
				t.hintsPart(
					"Select the config tool",
					"Select left side motors",
					"Set Rotation+ to key S",
					"Set Rotation- to key W",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partText(
					"Great, the motors are tuned! After the tutorial, try to set the speed higher so that your car is not slow",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c10cfgservo, saveVersion),
				t.partText("Time to configure servomotors. This is necessary for the car to be able to turn"),
				t.hintsPart(
					"Select the config tool",
					"Select left side motors",
					"Set Rotation+ to key D",
					"Set Rotation- to key A",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					"Your car is ready! After this message, press the green triangle button on the top of your screen to start your car. Good luck!",
				),
			],
		];
	}
}
