import { TasksControl } from "client/gui/static/TasksControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import type { Tutorial } from "client/tutorial/Tutorial";

export async function TutorialBasics(tutorial: typeof Tutorial) {
	tutorial.Control.startTutorial("BASICS", tutorial.Cancellable);
	const toolController = BuildingMode.instance.toolController;
	const allTools = toolController.allTools;
	const toolEnabler = toolController.enabledTools;
	toolEnabler.disableAll();

	tutorial.Control.displayStep(
		"Welcome to Plane Engineers! Now we will bring you up to date. Let's build a car!",
		true,
	);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	// Main
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(2, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(4, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(4, 1.5, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(6, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(8, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(10, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(12, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(14, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(16, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	// Up
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 3.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 3.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	// Right-front
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, -2, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, -4, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, -6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	// Right-back
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, -2, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, -4, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, -6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	// Left-front
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, 4, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 5.5, 6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	// Left-back
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, 4, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 5.5, 6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	toolEnabler.enableOnly(allTools.buildTool, allTools.buildTool2);
	allTools.buildTool2.mirrorMode.set({});

	spawn(() => {
		tutorial.Control.displayStep("Build a frame using ordinary blocks", false);

		TasksControl.instance.addTask("Select building tool");
		TasksControl.instance.addTask('Select "Block"');
		TasksControl.instance.addTask("Place all highlighted blocks");
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep("Great job! Now delete the useless block", false);

	TasksControl.instance.addTask("Select deleting tool");
	TasksControl.instance.addTask("Delete useless block");

	tutorial.deleteTool.addBlockToDelete({
		position: new Vector3(4, 1.5, 2),
	});

	toolEnabler.enableOnly(allTools.deleteTool);

	if (!(await tutorial.deleteTool.waitForBlocksToDelete())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep("Next, you need to install servomotors. They help the car turn", false);

	TasksControl.instance.addTask("Select building tool");
	TasksControl.instance.addTask('Select "Servo"');
	TasksControl.instance.addTask("Place all highlighted blocks");

	toolEnabler.enableOnly(allTools.buildTool, allTools.buildTool2);

	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(0, 3.5, -6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(18, 3.5, -6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(0, 3.5, 6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(18, 3.5, 6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;

	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 1.5, 6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 1.5, -6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 1.5, -6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 1.5, 6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"Now we need to lift the car, so it will be easier for us to install the wheels and motors",
		false,
	);

	tutorial.editTool.get().enabledModes.enableOnly("Move");
	toolEnabler.enableOnly(allTools.editTool);

	if (!(await tutorial.editTool.waitForMoveToolWork(new Vector3(0, 4, 0)))) return;

	tutorial.Finish();
}
