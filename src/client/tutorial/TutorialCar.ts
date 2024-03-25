import TutorialControl from "client/gui/static/TutorialControl";
import { Tutorial } from "client/tutorial/Tutorial";

export default async function carTutorial(control: TutorialControl) {
	control.startTutorial("CAR TUTORIAL", Tutorial.TutorialData.cancellable);

	control.displayStep("Welcome to the Plane Engineers! Now we will bring you up to date. Let's build a car!", true);

	await control.waitForNextButton();

	control.displayStep("no car for you haha", true);

	await control.waitForNextButton();

	control.finish();
}
