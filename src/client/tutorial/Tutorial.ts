import TutorialControl from "client/gui/static/TutorialControl";
import carTutorial from "client/tutorial/TutorialCar";

type Tutorial = "Car";

export namespace Tutorial {
	const Control = new TutorialControl();

	export class TutorialData {
		static cancellable = true;
	}

	export function Begin(tutorial: Tutorial) {
		switch (tutorial) {
			case "Car":
				carTutorial(Control);
				break;

			default:
				break;
		}
	}
}
