import { RunService } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { GameLoader } from "client/GameLoader";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { TestRunner } from "client/test/TestRunner";
import { Tutorial } from "client/tutorial/Tutorial";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { HostedService } from "shared/GameHost";
import { BlocksInitializer } from "shared/init/BlocksInitializer";

namespace Startup {
	@injectable
	class RunTutorialIfNoSlots extends HostedService {
		constructor(@inject tutorial: Tutorial) {
			super();

			this.onEnable(() => {
				task.spawn(() => {
					const data = GameLoader.waitForDataStorage();
					if (!data.slots.any((t) => t.blocks !== 0)) {
						TutorialBasics(tutorial);
					}
				});
			});
		}
	}
	@injectable
	class RunTestRunner extends HostedService {
		constructor(@inject di: DIContainer) {
			super();
			this.onEnable(() => TestRunner.create(di));
		}
	}

	export function initializeBasicsTutorial(builder: GameHostBuilder) {
		builder.services.registerService(RunTutorialIfNoSlots);
	}
	export function initializeTestRunner(builder: GameHostBuilder) {
		const testsEnabled = RunService.IsStudio(); // && Players.LocalPlayer.Name === "i3ymm";
		if (testsEnabled) builder.services.registerService(RunTestRunner);
	}
}

export class SandboxGame extends HostedService {
	static initialize(builder: GameHostBuilder) {
		LoadingController.show("Pre-init");
		LocalPlayerController.initializeSprintLogic(builder, RunService.IsStudio() ? 200 : 60);

		LoadingController.show("Waiting for server");
		GameLoader.waitForServer();

		LoadingController.show("Loading the game");
		builder.services.registerSingleton(BlocksInitializer.create());
		PlayModeController.initialize(builder);
		ClientBuildingValidationController.initialize(builder);
		Tutorial.initialize(builder);

		builder.services.registerService(this);
		Startup.initializeBasicsTutorial(builder);
		Startup.initializeTestRunner(builder);
	}
}
