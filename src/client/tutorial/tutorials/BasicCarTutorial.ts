import { ActionController } from "client/modes/build/ActionController";
import { BasicCarTutorialDiffs } from "client/tutorial/tutorials/BasicCarTutorial.diff";
import type { Tutorial } from "client/tutorial/Tutorial2";

@injectable
export class BasicCarTutorial {
	static readonly name = "Basics (car)";

	constructor(tutorial: Tutorial) {
		const { saveVersion, diffs } = BasicCarTutorialDiffs;

		tutorial.enable();
		const toolController = tutorial.buildingMode.toolController;
		const editTool = toolController.allTools.editTool;

		ActionController.instance.disable();
		toolController.enabledTools.disableAll();
		tutorial.onDestroy(() => {
			ActionController.instance.enable();
			toolController.enabledTools.enableAll();
			editTool.enabledModes.enableAll();
		});

		tutorial.waitPart(
			tutorial.partNextButton(),
			tutorial.partText("Welcome to Plane Engineers!\nThis tutorial will teach you the basics of the game."),
			tutorial.translatedTasksPart([`Hint: Press "next" to advance`]),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c1frame, saveVersion),
			tutorial.partText("First, let's build the frame for our car."),
			tutorial.translatedTasksPart(
				["Select the", " ", "build tool"],
				["Select", " ", `"`, "Blocks", `"`],
				["Select", " ", `"`, "Block", `"`],
				["Place all highlighted blocks"],
				[""],
				["Hint: Hold shift to build multiple blocks"],
			),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.deleteTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c2delete, saveVersion),
			tutorial.partText("del block ."),
			tutorial.translatedTasksPart(["Select the", " ", "delete tool"]),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.combinePartsParallel(
				tutorial.processDiff(diffs.c3servo1, saveVersion),
				tutorial.combinePartsSequential(
					() => tutorial.processDiff(diffs.c3servo2, saveVersion),
					() => tutorial.processDiff(diffs.c3servo3, saveVersion),
				),
			),
			tutorial.partText("build servos."),
			tutorial.translatedTasksPart(["Select the", " ", "build tool"]),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.editTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c4moveup, saveVersion),
			tutorial.partText("move up 4 studs/2 blocks."),
			tutorial.translatedTasksPart(["how write hlp"]),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c5motor, saveVersion),
			tutorial.partText("build motors they rrrrrrrrrrr car fast."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c6wheels, saveVersion),
			tutorial.partText("build wheels they rrrrrrrrrrr car fast."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c7seat, saveVersion),
			tutorial.partText("build SEAT it rrrrrrrrrrr car sit."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.configTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c8cfgmotorsright, saveVersion),
			tutorial.partText("cfg motors right set +W -S."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.configTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c9cfgmotorsleft, saveVersion),
			tutorial.partText("cfg motors LEFT set +S -W (oposit of righ)."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.configTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.c10cfgservo, saveVersion),
			tutorial.partText("cfg SERVOS both; set +D -A."),
		);

		toolController.enabledTools.disableAll();
		tutorial.waitPart(
			tutorial.partNextButton(),
			tutorial.partText("You are now the maks gaming of plane engineers."),
			tutorial.translatedTasksPart(["now launch it or something"]), // TODO: launch it in this step or something
		);

		tutorial.destroy();
	}
}
