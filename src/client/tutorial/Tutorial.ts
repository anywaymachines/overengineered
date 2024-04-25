import { TasksControl } from "client/gui/static/TasksControl";
import { TutorialControl } from "client/gui/static/TutorialControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { TutorialBuildTool } from "client/tutorial/TutorialBuildTool";
import { TutorialDeleteTool } from "client/tutorial/TutorialDeleteTool";
import { TutorialEditTool } from "client/tutorial/TutorialEditTool";
import { EventHandler } from "shared/event/EventHandler";
import { TutorialConfigTool } from "./TutorialConfigTool";

type TutorialType = "Basics";

export namespace Tutorial {
	export const Control = new TutorialControl();
	export const Cancellable = true;

	export const buildTool = new TutorialBuildTool(Tutorial);
	export const deleteTool = new TutorialDeleteTool(Tutorial);
	export const editTool = new TutorialEditTool(Tutorial);
	export const configTool = new TutorialConfigTool(Tutorial);

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
		editTool.cleanup();
		configTool.cleanup();

		BuildingMode.instance.toolController.enabledTools.enableAll();
		TasksControl.instance.finish();

		Control.finish();
	}
}
