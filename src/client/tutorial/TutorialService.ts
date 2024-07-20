import { BSOD } from "client/gui/BSOD";
import { NotificationPopup } from "client/gui/popup/NotificationPopup";
import { TutorialController } from "client/tutorial/TutorialController";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { TutorialDescriber } from "client/tutorial/TutorialController";

/** Service for running the tutorials */
@injectable
class TutorialsService extends HostedService {
	private runningTutorial?: TutorialDescriber;

	constructor(
		readonly allTutorials: readonly TutorialDescriber[],
		@inject private readonly di: DIContainer,
	) {
		super();
	}

	/** Run the provided tutorial. Yields until the tutorial end. */
	run(tutorial: TutorialDescriber): void {
		if (this.runningTutorial) {
			$log("Another tutorial is already running");
			return;
		}

		const controller = this.di.resolveForeignClass(TutorialController, [tutorial.name]);

		try {
			this.runningTutorial = tutorial;

			const parts = tutorial.create(controller);
			controller.enable();

			for (const func of parts) {
				try {
					const parts = func();
					controller.waitPart(...parts);
				} catch (err) {
					$warn(`Exception while running the tutorial "${tutorial.name}":`, err);
					NotificationPopup.showPopup("There was an error running the tutorial.", "It has been canceled.");

					controller.destroy();
					break;
				}
			}
		} catch (err) {
			BSOD.showWithDefaultText(err, "Tutorial has caused a crash");
			throw err;
		} finally {
			controller.destroy();
			this.runningTutorial = undefined;
		}
	}
}
export type { TutorialsService };

export namespace TutorialServiceInitializer {
	type TutorialCtor = new (...args: any[]) => TutorialDescriber;
	type InitializeConfiguration = {
		/** Tutorials to include */
		readonly tutorials: readonly TutorialCtor[];

		/** Tutorial to run when player has no slots on join */
		readonly tutorialToRunWhenNoSlots: TutorialCtor | undefined;
	};

	export function initialize(host: GameHostBuilder, config: InitializeConfiguration): void {
		const reg = host.services
			.registerService(TutorialsService)
			.withArgs((di) => [config.tutorials.map((t) => di.resolveForeignClass(t) as TutorialDescriber)]);

		if (config.tutorialToRunWhenNoSlots) {
			reg.onInit((service, di) => {
				const playerData = di.resolve<PlayerDataStorage>();

				service.onEnable(() => {
					if (playerData.slots.get().any((t) => t.blocks !== 0)) return;
					service.run(di.resolveForeignClass(config.tutorialToRunWhenNoSlots!));
				});
			});
		}
	}
}
