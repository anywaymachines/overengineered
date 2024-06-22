import { TasksControl } from "client/gui/static/TasksControl";
import { ActionController } from "client/modes/build/ActionController";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { Tutorial } from "client/tutorial/Tutorial";

export async function TutorialBasics(tutorial: Tutorial) {
	tutorial.Control.startTutorial("BASICS", tutorial.Cancellable);
	const toolController = tutorial.buildingMode.toolController;
	const allTools = toolController.allTools;
	const toolEnabler = toolController.enabledTools;
	toolEnabler.disableAll();
	ActionController.instance.disable();

	await ClientBuilding.deleteOperation.execute({ plot: tutorial.plot, blocks: "all" });
	tutorial.buildingMode.gui.actionbar.enabledButtons.enableOnly("settings");

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

	toolEnabler.enableOnly(allTools.buildTool);
	allTools.buildTool.mirrorMode.set({});

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

	toolEnabler.enableOnly(allTools.buildTool);

	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(0, 3.5, -6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "servomotorblock",
		cframe: new CFrame(0, 3.5, 6, 1, 0, 0, 0, -1, 8.742277657347586e-8, 0, -8.742277657347586e-8, -1),
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
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 3.5, 6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(18, 3.5, -6, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"Now we need to lift the car, so it will be easier for us to install the wheels and motors",
		false,
	);

	TasksControl.instance.addTask("Select editing tool");
	TasksControl.instance.addTask("Select plot");
	TasksControl.instance.addTask("Select move mode");
	TasksControl.instance.addTask("Move building up 4 times (2 blocks)");

	tutorial.editTool.get().enabledModes.enableOnly("Move");
	toolEnabler.enableOnly(allTools.editTool);

	const blocks = new ReadonlyMap(tutorial.plot.getBlocks().map((b) => [b, b.GetPivot().add(new Vector3(0, 4, 0))]));
	if (!(await tutorial.editTool.waitForMoveToolWork(blocks))) return;
	TasksControl.instance.finish();
	tutorial.editTool.get().enabledModes.enableAll();

	toolEnabler.disableAll();
	tutorial.Control.displayStep("Great! Let's install motors that will turn the wheels and move the car!", false);
	toolEnabler.enableOnly(allTools.buildTool);

	TasksControl.instance.addTask("Select building tool");
	TasksControl.instance.addTask('Select "Motor"');
	TasksControl.instance.addTask("Place all highlighted blocks");

	tutorial.buildTool.addBlockToPlace({
		id: "motorblock",
		cframe: new CFrame(0, 5.5, 8.0006103515625, 1, 0, 0, 0, -4.371138828673793e-8, -1, 0, 1, -4.371138828673793e-8),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "motorblock",
		cframe: new CFrame(
			18,
			5.5,
			8.0006103515625,
			1,
			0,
			0,
			0,
			-4.371138828673793e-8,
			-1,
			0,
			1,
			-4.371138828673793e-8,
		),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "motorblock",
		cframe: new CFrame(
			18,
			5.5,
			-8.0006103515625,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "motorblock",
		cframe: new CFrame(
			0,
			5.5,
			-8.0006103515625,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep("Nice, now you can install wheels", false);
	toolEnabler.enableOnly(allTools.buildTool);

	TasksControl.instance.addTask("Select building tool");
	TasksControl.instance.addTask('Select "Small Wheel"');
	TasksControl.instance.addTask("Place all highlighted blocks");

	tutorial.buildTool.addBlockToPlace({
		id: "smallwheel",
		cframe: new CFrame(
			0,
			5.5,
			-10.00042724609375,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "smallwheel",
		cframe: new CFrame(
			18,
			5.5,
			-10.00042724609375,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "smallwheel",
		cframe: new CFrame(
			18,
			5.5,
			10.00079345703125,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	tutorial.buildTool.addBlockToPlace({
		id: "smallwheel",
		cframe: new CFrame(
			0,
			5.5,
			10.00079345703125,
			1,
			-1.528548372131764e-14,
			-1.7484555314695172e-7,
			1.7484555314695172e-7,
			1.3113415775478643e-7,
			1,
			7.64274186065882e-15,
			-1,
			1.3113415775478643e-7,
		),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"The last step before setting up the motors is to install the seat where you will be sitting",
		false,
	);
	toolEnabler.enableOnly(allTools.buildTool);

	TasksControl.instance.addTask("Select building tool");
	TasksControl.instance.addTask('Select "Vehicle Seat"');
	TasksControl.instance.addTask("Place highlighted block");

	tutorial.buildTool.addBlockToPlace({
		id: "vehicleseat",
		cframe: new CFrame(
			9,
			8.5006103515625,
			0,
			-2.18556948539117e-7,
			0,
			1,
			1.7484555314695172e-7,
			1,
			3.821370845626115e-14,
			-1,
			1.7484555314695172e-7,
			-2.18556948539117e-7,
		),
	});

	if (!(await tutorial.buildTool.waitForBlocksToPlace())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"It's time to adjust the controls, let's start with the rotary mechanism. Configure the right side motors first",
		false,
	);
	toolEnabler.enableOnly(allTools.configTool);
	TasksControl.instance.addTask("Select configuring tool");
	TasksControl.instance.addTask("Select all motors");
	TasksControl.instance.addTask("Set Rotation+ to key W");
	TasksControl.instance.addTask("Set Rotation- to key S");

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(0, 5.5, -8),
		key: "rotationSpeed",
		value: { rotation: { add: "W", sub: "S" } },
	});

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(18, 5.5, -8),
		key: "rotationSpeed",
		value: { rotation: { add: "W", sub: "S" } },
	});

	if (!(await tutorial.configTool.waitForBlocksConfigure())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"Great! Now configure the left side motors of your car. It's like the right side, but inversed",
		false,
	);
	toolEnabler.enableOnly(allTools.configTool);
	TasksControl.instance.addTask("Select configuring tool");
	TasksControl.instance.addTask("Select all motors");
	TasksControl.instance.addTask("Set Rotation+ to key S");
	TasksControl.instance.addTask("Set Rotation- to key W");

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(0, 5.5, 8),
		key: "rotationSpeed",
		value: { rotation: { add: "S", sub: "W" } },
	});

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(18, 5.5, 8),
		key: "rotationSpeed",
		value: { rotation: { add: "S", sub: "W" } },
	});

	if (!(await tutorial.configTool.waitForBlocksConfigure())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"Great, the motors are tuned! After the tutorial, try to set the speed higher so that your car is not slow",
		true,
	);
	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.Control.displayStep("Time to configure servomotors. This is necessary so that the car can turn", false);

	toolEnabler.enableOnly(allTools.configTool);
	TasksControl.instance.addTask("Select configuring tool");
	TasksControl.instance.addTask("Select all servo motors");
	TasksControl.instance.addTask("Set Rotation+ to key D");
	TasksControl.instance.addTask("Set Rotation- to key A");

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(0, 7.5, -6),
		key: "angle",
		value: { rotation: { add: "D", sub: "A" } },
	});

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(0, 7.5, 6),
		key: "angle",
		value: { rotation: { add: "D", sub: "A" } },
	});

	if (!(await tutorial.configTool.waitForBlocksConfigure())) return;
	toolEnabler.disableAll();
	TasksControl.instance.finish();

	tutorial.Control.displayStep(
		"Your car is ready! Press run triangle button on the top of your screen to test. Good luck!",
		true,
	);
	if (!(await tutorial.WaitForNextButtonPress())) return;

	toolEnabler.disableAll();
	TasksControl.instance.finish();
	tutorial.buildingMode.gui.actionbar.enabledButtons.enableAll();

	tutorial.Finish();
}
