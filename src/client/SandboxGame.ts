import { Players, RunService, Workspace } from "@rbxts/services";
import { BeaconController } from "client/controller/BeaconController";
import { CameraController } from "client/controller/CameraController";
import { ChatController } from "client/controller/ChatController";
import { DayCycleController } from "client/controller/DayCycleController";
import { DistanceHideController } from "client/controller/DistanceHideController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { OtherPlayersController } from "client/controller/OtherPlayersController";
import { RagdollController } from "client/controller/RagdollController";
import { MusicController } from "client/controller/sound/MusicController";
import { AdminGui } from "client/gui/AdminGui";
import { GuiAutoScaleController } from "client/gui/GuiAutoScaleController";
import { ControlsPopup } from "client/gui/popup/ControlsPopup";
import { SavePopup } from "client/gui/popup/SavePopup";
import { SettingsPopup } from "client/gui/popup/SettingsPopup";
import { WikiPopup } from "client/gui/popup/WikiPopup";
import { Keybinds } from "client/Keybinds";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { PlayerDataInitializer } from "client/PlayerDataStorage";
import { TerrainController } from "client/terrain/TerrainController";
import { TestRunner } from "client/test/TestRunner";
import { Tutorial } from "client/tutorial/Tutorial";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { SharedPlots } from "shared/building/SharedPlots";
import { HostedService } from "shared/GameHost";
import { BlocksInitializer } from "shared/init/BlocksInitializer";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

namespace Startup {
	@injectable
	class RunTutorialIfNoSlots extends HostedService {
		constructor(@inject tutorial: Tutorial, @inject playerData: PlayerDataStorage) {
			super();

			this.onEnable(() => {
				if (!playerData.slots.get().any((t) => t.blocks !== 0)) {
					TutorialBasics(tutorial);
				}
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
		PlayerDataInitializer.initialize(builder);

		LoadingController.show("Pre-init");
		LocalPlayerController.initializeDisablingFluidForces(builder);
		LocalPlayerController.initializeSprintLogic(builder, RunService.IsStudio() ? 200 : 60);
		LocalPlayerController.initializeCameraMaxZoomDistance(builder, 512);
		OtherPlayersController.initializeMassless(builder);
		builder.services.registerService(RagdollController);

		LoadingController.show("Waiting for server");
		while (!(Workspace.HasTag("GameLoaded") as boolean | undefined)) {
			task.wait();
		}

		builder.services.registerSingletonClass(Keybinds);
		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		LoadingController.show("Waiting for plot");
		builder.services.registerSingletonFunc((ctx) =>
			ctx.resolve<SharedPlots>().waitForPlot(Players.LocalPlayer.UserId),
		);

		builder.services.registerSingleton(BlocksInitializer.create());
		PlayModeController.initialize(builder);
		ClientBuildingValidationController.initialize(builder);
		Tutorial.initialize(builder);

		builder.services.registerService(GameEnvironmentController);
		builder.services.registerService(DistanceHideController);
		AdminGui.initializeIfAdminOrStudio(builder);

		builder.services.registerService(DayCycleController);
		builder.services.registerService(BeaconController);
		builder.services.registerService(GraphicsSettingsController);
		builder.services.registerService(CameraController);
		builder.services.registerService(TerrainController);
		builder.services.registerService(MusicController);
		builder.services.registerService(GuiAutoScaleController);

		ChatController.initializeAdminPrefix();
		SettingsPopup.addAsService(builder);
		SavePopup.addAsService(builder);
		ControlsPopup.addAsService(builder);
		WikiPopup.addAsService(builder);

		Startup.initializeBasicsTutorial(builder);
		Startup.initializeTestRunner(builder);

		LoadingController.show("Initializing something");
	}
}
