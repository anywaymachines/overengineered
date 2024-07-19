import { InputController } from "client/controller/InputController";
import { ActionController } from "client/modes/build/ActionController";
import type { Tutorial } from "client/tutorial/Tutorial2";
import type { BuildingDiffChange } from "shared/building/BuildingDiffer";

const saveVersion = 23;
const diffs = {
	d0buildFrame: [
		{ block: { uuid: "bdel", location: new CFrame(29, 1.5, 11), id: "block" }, type: "added" },
		{ block: { uuid: "b9", location: new CFrame(29, 3.5, 11), id: "block" }, type: "added" },
		{ block: { uuid: "b5", location: new CFrame(35, 1.5, 11), id: "block" }, type: "added" },
		{ block: { uuid: "b4", location: new CFrame(31, 1.5, 9), id: "block" }, type: "added" },
		{ block: { uuid: "b7", location: new CFrame(29, 3.5, 9), id: "block" }, type: "added" },
		{ block: { uuid: "b6", location: new CFrame(35, 1.5, 7), id: "block" }, type: "added" },
		{ block: { uuid: "b8", location: new CFrame(29, 3.5, 7), id: "block" }, type: "added" },
		{ block: { uuid: "b1", location: new CFrame(33, 1.5, 9), id: "block" }, type: "added" },
		{ block: { uuid: "b2", location: new CFrame(35, 1.5, 9), id: "block" }, type: "added" },
		{ block: { uuid: "b3", location: new CFrame(29, 1.5, 9), id: "block" }, type: "added" },
	],
	d1deleteBlock: [{ uuid: "bdel", type: "removed" }],
	d2placeServos: [
		{
			block: {
				uuid: "s1",
				location: new CFrame(29, 3.5, 13, 1, 0, 0, 0, -1, 0, 0, 0, -1),
				id: "servomotorblock",
			},
			type: "added",
		},
		{
			block: { uuid: "s2", location: new CFrame(29, 3.5, 5, 1, 0, 0, 0, -1, 0, 0, 0, -1), id: "servomotorblock" },
			type: "added",
		},
		{ block: { uuid: "bb1", location: new CFrame(29, 1.5, 5), id: "block" }, type: "added" },
		{ block: { uuid: "bb2", location: new CFrame(29, 1.5, 13), id: "block" }, type: "added" },
	],
	d3placeSeat: [
		{
			block: { uuid: "seat", location: new CFrame(34, 4.5, 9, 0, 0, 1, 0, 1, 0, -1, 0, 0), id: "vehicleseat" },
			type: "added",
		},
	],
	d4prtest: [
		{ uuid: "b8", type: "removed" },
		{ block: { uuid: "bbb1", location: new CFrame(29, 5.5, 10), id: "block" }, type: "added" },
	],
	d5cfgtest: [{ uuid: "s1", key: "angle", value: { rotation: { add: "W", sub: "S" } }, type: "configChanged" }],
} satisfies { readonly [k in string]: readonly BuildingDiffChange[] };

@injectable
export class TestTutorial {
	static readonly name = "Test tutorial";

	constructor(tutorial: Tutorial) {
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
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d0buildFrame, saveVersion),
			tutorial.partText("First, let's build the frame for our car."),
			tutorial.tasksPart(
				"Select one",
				"Select 'blocks'",
				"Select BLOCK",
				"BLOCK IS COMING",
				"             HIDE",
				"",
				"hint: hold shift to build multiple",
			),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.deleteTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d1deleteBlock, saveVersion),
			tutorial.partText("Whoops, we placed one block too many. Delete it."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d2placeServos, saveVersion),
			tutorial.partText("Now place the rotators for rotatoring."),
			tutorial.tasksPart(
				`Hint: You can press ${(() => {
					const it = InputController.inputType.get();
					if (it === "Desktop") return "the middle mouse button";
					if (it === "Touch") return "the pipette button on the inventory";
					return "idk something gamepad button";
				})()} to copy the block`,
			),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d3placeSeat, saveVersion),
			tutorial.partText("seat place or vehicl no work"),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool, toolController.allTools.deleteTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d4prtest, saveVersion),
			tutorial.partText("Now delete and place for TESTING mega TESTING."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.configTool);
		tutorial.waitPart(
			tutorial.processDiff(diffs.d5cfgtest, saveVersion),
			tutorial.partText("Now change the motor config to +W -S !!!!!!!!!!important"),
			tutorial.tasksPart(
				"Select 4 config tool",
				"Select the blockl",
				"Select +",
				"select W",
				"             select -",
				"select S",
				"profit",
			),
		);

		toolController.enabledTools.disableAll();
		tutorial.waitPart(
			tutorial.partNextButton(),
			tutorial.partText("You are now the maks gaming of plane engineers."),
			tutorial.tasksPart("Important tip: This is a car"),
			// TODO: launch it in this step or something
		);

		tutorial.destroy();
	}
}
