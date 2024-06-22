import { TasksControl } from "client/gui/static/TasksControl";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { Tutorial } from "client/tutorial/Tutorial";

export async function TestTutorial(tutorial: Tutorial) {
	tutorial.Control.startTutorial("TEST", tutorial.Cancellable);
	const toolController = tutorial.buildingMode.toolController;
	const allTools = toolController.allTools;
	const toolEnabler = toolController.enabledTools;

	await ClientBuilding.deleteOperation.execute({ plot: tutorial.plot, blocks: "all" });
	tutorial.buildingMode.gui.actionbar.enabledButtons.enableOnly("settings");

	// Main
	tutorial.buildTool.addBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 1.5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1),
	});
	tutorial.buildTool.addBlockToPlace({
		id: "motorblock",
		cframe: new CFrame(0, 1.5, -6, 1, 0, 0, 0, -1, 0, 0, -0, -1),
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

	toolEnabler.enableOnly(allTools.configTool);
	spawn(() => {
		tutorial.Control.displayStep("Build a plane to crash", false);

		TasksControl.instance.addTask("Select CONFIGF tool");
		TasksControl.instance.addTask('Select "Block"');
		TasksControl.instance.addTask("Place all highlighted blocks");
	});

	tutorial.configTool.addBlockToConfigure({
		position: new Vector3(0, 1.5, -6),
		key: "rotationSpeed",
		value: { rotation: { add: "W", sub: "S" } },
	});
	if (!(await tutorial.configTool.waitForBlocksConfigure())) return;

	tutorial.buildingMode.gui.actionbar.enabledButtons.enableAll();
	TasksControl.instance.finish();
	tutorial.Finish();
}
