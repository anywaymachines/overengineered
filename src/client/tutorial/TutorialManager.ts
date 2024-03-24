import TutorialControl from "client/gui/static/TutorialControl";

type Tutorial = "Car";

export default class TutorialManager {
	private static tutorialControl = new TutorialControl("BUILDING CAR", false);

	static startTutorial(tutorial: Tutorial, cancellable: boolean = false) {
		this.tutorialControl.show();

		if (tutorial === "Car") {
			this.carTutorial();
		}
	}

	static async carTutorial() {
		this.tutorialControl.showStep(
			"Welcome to the Plane Engineers! Now we will bring you up to date. Let's build a car!",
			true,
		);

		await this.tutorialControl.waitForNextButton();

		this.tutorialControl.showStep("no car for you haha", true);

		await this.tutorialControl.waitForNextButton();

		this.tutorialControl.finish();
	}
}
