import { TutorialControl } from "client/gui/static/TutorialControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { TutorialBuildTool } from "client/tutorial/TutorialBuildTool";
import { TutorialDeleteTool } from "client/tutorial/TutorialDeleteTool";
import { EventHandler } from "shared/event/EventHandler";

type TutorialType = "Basics";

declare global {
	type TutorialPlaceBlockHighlight = {
		id: string;
		cframe: CFrame;
	};

	type TutorialDeleteBlockHighlight = {
		position: Vector3;
	};
}

export namespace Tutorial {
	export const Control = new TutorialControl();
	export const Cancellable = true;

	export const buildTool = new TutorialBuildTool(Tutorial);
	export const deleteTool = new TutorialDeleteTool(Tutorial);

	export async function WaitForNextButtonPress(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribeOnce(Control.instance.Header.Next.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				Finish();
				resolve(false);
			});
		});
	}

	/** Starts the tutorial scenery */
	export function Begin(tutorial: TutorialType) {
		switch (tutorial) {
			case "Basics":
				TutorialBasics(Tutorial);
				break;

			default:
				break;
		}
	}

	/** Ends the tutorial */
	export function Finish() {
		buildTool.cleanup();
		deleteTool.cleanup();

		BuildingMode.instance.toolController.disabledTools.set([]);

		Control.finish();
	}
}
