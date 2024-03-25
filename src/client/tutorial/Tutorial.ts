import TutorialControl from "client/gui/static/TutorialControl";
import TutorialCar from "client/tutorial/TutorialCar";
import EventHandler from "shared/event/EventHandler";

type TutorialType = "Car";

type TutorialPlaceBlocksHighlight = {
	id: string;
	cframe: CFrame;
};

export default class Tutorial {
	static Control = new TutorialControl();

	static Cancellable = true;
	static BlocksToPlace: TutorialPlaceBlocksHighlight[] = [];

	static async WaitForNextButtonPress(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribeOnce(this.Control.getGui().Header.Next.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.Control.getGui().Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.Control.finish();
				resolve(false);
			});
		});
	}

	static Begin(tutorial: TutorialType) {
		switch (tutorial) {
			case "Car":
				TutorialCar(this);
				break;

			default:
				break;
		}
	}
}
