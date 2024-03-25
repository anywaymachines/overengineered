import Tutorial from "client/tutorial/Tutorial";

export default async function TutorialBasics(tutorial: typeof Tutorial) {
	tutorial.Control.startTutorial("BASICS", tutorial.Cancellable);

	tutorial.Control.displayStep(
		"Welcome to Plane Engineers! Now we will bring you up to date. Let's build a car!",
		true,
	);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.AddBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 1.5, 0),
	});
	tutorial.AddBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 3.5, 0),
	});
	tutorial.AddBlockToPlace({
		id: "block",
		cframe: new CFrame(0, 3.5, 2),
	});
	tutorial.AddBlockToPlace({
		id: "tnt",
		cframe: new CFrame(0, 5.5, 2),
	});

	tutorial.Control.displayStep("no car for you haha", false);

	if (!(await tutorial.WaitForBlocksToPlace())) return;

	tutorial.ClearBlocksToPlace();

	tutorial.Control.displayStep("Great job!", true);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.AddBlockToRemove({
		position: new Vector3(0, 5.5, 2),
	});

	tutorial.Control.displayStep("Remove useless block", false);

	if (!(await tutorial.WaitForBlocksToRemove())) return;

	tutorial.Control.displayStep("the end", true);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.Control.finish();
}
