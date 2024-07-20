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
					["Select the", " ", "build tool"],
					["Select", " ", `"`, "Blocks", `"`],
					["Select", " ", `"`, "Block", `"`],
					["Place all highlighted blocks"],
					[""],
					["Hint: Hold shift to build multiple blocks"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.deleteTool)),
				t.processDiff(diffs.c2delete, saveVersion),
				t.partText("del block ."),
				t.translatedTasksPart(["Select the", " ", "delete tool"]),
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
				t.partText("build servos."),
				t.translatedTasksPart(["Select the", " ", "build tool"]),
			],

			() => [
				t.funcPart(() => {
					toolController.enabledTools.enableOnly(toolController.allTools.editTool);
					editTool.enabledModes.enableOnly("Move");
				}),
				t.processDiff(diffs.c4moveup, saveVersion),
				t.partText("move up 4 studs/2 blocks."),
				t.translatedTasksPart(["how write hlp"]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c5motor, saveVersion),
				t.partText("build motors they rrrrrrrrrrr car fast."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c6wheels, saveVersion),
				t.partText("build wheels they rrrrrrrrrrr car fast."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.c7seat, saveVersion),
				t.partText("build SEAT it rrrrrrrrrrr car sit."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c8cfgmotorsright, saveVersion),
				t.partText("cfg motors right set +W -S."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c9cfgmotorsleft, saveVersion),
				t.partText("cfg motors LEFT set +S -W (oposit of righ)."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.c10cfgservo, saveVersion),
				t.partText("cfg SERVOS both; set +D -A."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("You are now the maks gaming of plane engineers."),
				t.translatedTasksPart(["now launch it or something"]), // TODO: launch it in this step or something
			],
		];
	}
}
