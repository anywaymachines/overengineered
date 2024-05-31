import { TasksControl } from "client/gui/static/TasksControl";
import { TutorialControl } from "client/gui/static/TutorialControl";
import { ActionController } from "client/modes/build/ActionController";
import { TutorialBuildTool } from "client/tutorial/TutorialBuildTool";
import { TutorialConfigTool } from "client/tutorial/TutorialConfigTool";
import { TutorialDeleteTool } from "client/tutorial/TutorialDeleteTool";
import { TutorialEditTool } from "client/tutorial/TutorialEditTool";
import { EventHandler } from "shared/event/EventHandler";
import type { BuildingMode } from "client/modes/build/BuildingMode";

@injectable
export class Tutorial {
	static initialize(host: GameHostBuilder) {
		host.services.registerSingletonClass(this);
	}

	readonly Control = new TutorialControl();
	readonly Cancellable = true;
	private isActive = false;

	readonly buildTool: TutorialBuildTool;
	readonly deleteTool: TutorialDeleteTool;
	readonly editTool: TutorialEditTool;
	readonly configTool: TutorialConfigTool;

	constructor(
		@inject readonly buildingMode: BuildingMode,
		@inject di: DIContainer,
	) {
		di = di.beginScope();
		di.registerSingleton(this);

		this.buildTool = di.resolveForeignClass(TutorialBuildTool);
		this.deleteTool = di.resolveForeignClass(TutorialDeleteTool);
		this.editTool = di.resolveForeignClass(TutorialEditTool);
		this.configTool = di.resolveForeignClass(TutorialConfigTool);
	}

	async WaitForNextButtonPress(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribeOnce(this.Control.instance.Header.Next.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.Finish();
				resolve(false);
			});
		});
	}

	/** Ends the tutorial */
	Finish() {
		this.buildTool.cleanup();
		this.deleteTool.cleanup();
		this.editTool.cleanup();
		this.configTool.cleanup();

		this.buildingMode.toolController.enabledTools.enableAll();
		this.buildingMode.gui.actionbar.enabledButtons.enableAll();
		this.buildingMode.toolController.allTools.editTool.enabledModes.enableAll();
		TasksControl.instance.finish();
		ActionController.instance.enable();

		this.Control.finish();
		this.isActive = false;
	}
}
