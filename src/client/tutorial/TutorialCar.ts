import Tutorial from "client/tutorial/Tutorial";

export default async function TutorialCar(tutorial: typeof Tutorial) {
	tutorial.Control.startTutorial("CAR TUTORIAL", tutorial.Cancellable);

	tutorial.Control.displayStep(
		"Welcome to the Plane Engineers! Now we will bring you up to date. Let's build a car!",
		true,
	);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.Control.displayStep("no car for you haha", true);

	if (!(await tutorial.WaitForNextButtonPress())) return;

	tutorial.Control.finish();
}
