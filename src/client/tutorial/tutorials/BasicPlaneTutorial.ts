import { InputController } from "client/controller/InputController";
import { ActionController } from "client/modes/build/ActionController";
import { BasicPlaneTutorialDiffs } from "client/tutorial/tutorials/BasicPlaneTutorial.diff";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class BasicPlaneTutorial implements TutorialDescriber {
	readonly name = "Basics/plane";

	constructor(@inject private readonly buildingMode: BuildingMode) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { saveVersion, diffs } = BasicPlaneTutorialDiffs;
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
					"This tutorial will teach you how to build a basic plane.",
				),
				t.translatedHintsPart([`Hint: Press "next" to advance`]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.base, saveVersion),
				t.partText("First, let's build the frame for your plane."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Block"`],
					["Place all the highlighted blocks"],
					[""],
					InputController.inputType.get() === "Desktop"
						? ["Hint: Hold shift to build multiple blocks"]
						: ['Hint: Press "++" to build multiple blocks'],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.servos, saveVersion),
				t.partText(
					"Now let's place the servos that will control your wings.\nThis type of motor allows you to set the degree of deviation, which is very convenient",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Motors"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.wings, saveVersion),
				t.partText(
					"Now install the wings themselves. The wings work according to the law of aerodynamics, so thanks to them you can fly",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Wings"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.rockets, saveVersion),
				t.partText("Now let's install two small rocket engines to create the force"),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Rockets"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => {
					toolController.enabledTools.enableOnly(toolController.allTools.editTool);
					editTool.enabledModes.enableOnly("Move");
				}),
				t.processDiff(diffs.move, saveVersion),
				t.partText("Move the entire building higher so that the chassis can be installed"),
				t.translatedHintsPart([
					"Select the edit tool",
					`Press "Select plot"`,
					`Press "Move"`,
					"Move the whole building up",
				]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.gears_beams, saveVersion),
				t.partText(
					"Next, you need to build a chassis. First, build the blocks to which the chassis will be attached",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Block"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.gears_hinges, saveVersion),
				t.partText("Wheels need hinges to rotate freely. Build them!"),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Physics"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.wheels, saveVersion),
				t.partText("It is logical to assume that now you need wheels"),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Wheels"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.seat, saveVersion),
				t.partText("Before you start setting everything up, place the pilot's seat"),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Seats"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("Great, now it remains to set everything up. Let's start with the front wings..."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.partNextButton(),
				t.partText("The front wings are ailerons, and they allow the aircraft to turn while in the air"),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.front_wings_config, saveVersion),
				t.partText("Set up the servos that are located near the aileron wings"),
				t.hintsPart(
					"Select the config tool",
					"Select servo motors",
					"Set Rotation+ to key A",
					"Set Rotation- to key D",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					"Great. Now we need to adjust the back wings. They are responsible for controlling the height of the aircraft.",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.back_wings_config_1, saveVersion),
				t.partText("Set up the servo on the back of the plane"),
				t.translatedHintsPart(
					["Select the config tool"],
					["Select one of the servo motors"],
					["Set Rotation+ to key S"],
					["Set Rotation- to key W"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.back_wings_config_2, saveVersion),
				t.partText("Now set up the other servo"),
				t.translatedHintsPart(
					["Select the config tool"],
					["Select one of the servo motors"],
					["Set Rotation+ to key W"],
					["Set Rotation- to key S"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.rocket_config, saveVersion),
				t.partText("And, finally, adjust the engine controls"),
				t.translatedHintsPart(
					["Select the config tool"],
					["Select one of the servo motors"],
					["Set Thrust+ to key R"],
					["Set Thrust- to key F"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					"Your plane is ready! After this message, press the triangle button on the top of your screen to start your creation. Good luck!",
				),
			],
		];
	}
}
