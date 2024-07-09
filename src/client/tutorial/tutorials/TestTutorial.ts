import { Tutorial } from "client/tutorial/Tutorial2";
import type { TutorialPartRegistration } from "client/tutorial/Tutorial2";
import type { LatestSerializedBlock, LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { BuildingDiffChange, DiffBlock } from "shared/building/BuildingDiffer";

type lsb = ReplaceWith<
	LatestSerializedBlocks,
	{ readonly blocks: ReplaceWith<LatestSerializedBlock, { readonly uuid: string }>[] }
>;

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
} satisfies { readonly [k in string]: readonly BuildingDiffChange[] };

const diffprocess = (
	tutorial: Tutorial,
	diffs: readonly BuildingDiffChange[],
	saveVersion: number,
): TutorialPartRegistration => {
	const istype = <const TType extends BuildingDiffChange["type"], T>(
		actualType: BuildingDiffChange["type"],
		wantedType: TType,
		changes: BuildingDiffChange[],
	): changes is Extract<BuildingDiffChange, { type: TType }>[] => actualType === wantedType;
	const toBlock = (block: DiffBlock): LatestSerializedBlock => block as LatestSerializedBlock;

	const get = (
		changeType: BuildingDiffChange["type"],
		change: BuildingDiffChange[],
	): TutorialPartRegistration | undefined => {
		if (istype(changeType, "added", change)) {
			return tutorial.partBuild({ version: saveVersion, blocks: change.map((c) => toBlock(c.block)) });
		}
		if (istype(changeType, "removed", change)) {
			return tutorial.partDelete(change.map((c) => c.uuid));
		}

		if (istype(changeType, "changed", change)) {
			for (const [key, c] of change.groupBy((c) => c.key)) {
				if (key === "id") continue;
				if (key === "uuid") continue;

				// TODO:
			}
		}
	};

	const parts: TutorialPartRegistration[] = [];
	for (const [changeType, change] of diffs.groupBy((d) => d.type)) {
		const exec = get(changeType, change);
		if (!exec) continue;

		parts.push(exec);
	}

	return tutorial.combineParts(...parts);
};
const processDiffArr = (tutorial: Tutorial, diff: readonly BuildingDiffChange[]): TutorialPartRegistration =>
	diffprocess(tutorial, diff, saveVersion);

export namespace TestTutorial {
	export function start(di: DIContainer) {
		const tutorial = di.resolveForeignClass(Tutorial, ["Test tutorial"]);
		tutorial.enable();
		const toolController = tutorial.buildingMode.toolController;
		const editTool = toolController.allTools.editTool;

		toolController.enabledTools.disableAll();
		tutorial.onDestroy(() => {
			toolController.enabledTools.enableAll();
			editTool.enabledModes.enableAll();
		});

		tutorial.waitPart(
			tutorial.partText("Welcome to Plane Engineers!\nThis tutorial will teach you the basics of the game."),
			tutorial.partNextButton(),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			processDiffArr(tutorial, diffs.d0buildFrame),
			tutorial.tasksPart(
				"Select one",
				"Select 'blocks'",
				"Select BLOCK",
				"BLOCK IS COMING",
				"             HIDE",
				"",
			),
			tutorial.partText("First, let's build the frame for our car."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.deleteTool);
		tutorial.waitPart(
			processDiffArr(tutorial, diffs.d1deleteBlock),
			tutorial.partText("Whoops, we placed one block too many. Delete it."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			processDiffArr(tutorial, diffs.d2placeServos),
			tutorial.partText("Now place the rotators for rotatoring."),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool);
		tutorial.waitPart(
			processDiffArr(tutorial, diffs.d3placeSeat),
			tutorial.partText("seat place or vehicl no work"),
		);

		toolController.enabledTools.enableOnly(toolController.allTools.buildTool, toolController.allTools.deleteTool);
		tutorial.waitPart(
			processDiffArr(tutorial, diffs.d4prtest),
			tutorial.partText("Now delete and place for TESTING mega TESTING."),
		);

		toolController.enabledTools.disableAll();
		tutorial.waitPart(
			tutorial.partText("You are now the maks gaming of plane engineers."),
			tutorial.partNextButton(),
		);

		tutorial.destroy();
	}
}
