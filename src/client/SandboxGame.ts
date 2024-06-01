import { Players, RunService } from "@rbxts/services";
import { BeaconController } from "client/controller/BeaconController";
import { DayCycleController } from "client/controller/DayCycleController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { GameLoader } from "client/GameLoader";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { TestRunner } from "client/test/TestRunner";
import { Tutorial } from "client/tutorial/Tutorial";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { SharedPlots } from "shared/building/SharedPlots";
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

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		const loading = (str: string) => LoadingController.show(`Initializing ${str}`);
		const dataLoading = PlayerDataStorage.init();

		LoadingController.show("Pre-init");
		LocalPlayerController.initializeSprintLogic(builder, RunService.IsStudio() ? 200 : 60);

		LoadingController.show("Waiting for server");
		GameLoader.waitForServer();

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		LoadingController.show("Waiting for plot");
		builder.services.registerSingletonFunc((ctx) =>
			ctx.resolve<SharedPlots>().waitForPlot(Players.LocalPlayer.UserId),
		);

		LoadingController.show("Waiting for data");
		const [s, r] = dataLoading.await();
		if (!s) throw r;

		loading("blocks");
		builder.services.registerSingleton(BlocksInitializer.create());
		loading("play modes");
		PlayModeController.initialize(builder);
		loading("building validation");
		ClientBuildingValidationController.initialize(builder);
		loading("tutorial");
		Tutorial.initialize(builder);

		loading("day cycle");
		builder.services.registerService(DayCycleController);
		loading("beacons");
		builder.services.registerService(BeaconController);
		loading("graphics");
		builder.services.registerService(GraphicsSettingsController);

		loading("basics tutorial");
		Startup.initializeBasicsTutorial(builder);
		loading("test runner");
		Startup.initializeTestRunner(builder);

		loading("something?");
	}
}
