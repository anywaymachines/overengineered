import { Players, Workspace } from "@rbxts/services";
import { ClientEffectCreator } from "client/ClientEffectCreator";
import { AchievementController } from "client/controller/AchievementController";
import { BeaconController } from "client/controller/BeaconController";
import { BlurController } from "client/controller/BlurController";
import { CameraController } from "client/controller/CameraController";
import { ChatController } from "client/controller/ChatController";
import { DayCycleController } from "client/controller/DayCycleController";
import { EnvBlacklistsController } from "client/controller/EnvBlacklistsController";
import { FreecamController } from "client/controller/FreecamController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { ObstaclesController } from "client/controller/ObstaclesController";
import { OtherPlayersController } from "client/controller/OtherPlayersController";
import { RagdollController } from "client/controller/RagdollController";
import { MusicController } from "client/controller/sound/MusicController";
import { SoundController } from "client/controller/SoundController";
import { UpdatePopupController } from "client/controller/UpdatePopupController";
import { AdminGui } from "client/gui/AdminGui";
import { FpsCounterController } from "client/gui/FpsCounterController";
import { GuiAutoScaleController } from "client/gui/GuiAutoScaleController";
import { HideInterfaceController } from "client/gui/HideInterfaceController";
import { MainScene } from "client/gui/MainScene";
import { MainScreenLayout } from "client/gui/MainScreenLayout";
import { PopupController } from "client/gui/PopupController";
import { RainbowGuiController } from "client/gui/RainbowGuiController";
import { LogControl } from "client/gui/static/LogControl";
import { PlayModeController } from "client/modes/PlayModeController";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { TerrainController } from "client/terrain/TerrainController";
import { Theme } from "client/Theme";
import { ThemeAutoSetter } from "client/ThemeAutoSetter";
import { ToolController } from "client/tools/ToolController";
import { BasicCarTutorial } from "client/tutorial/tutorials/BasicCarTutorial";
import { BasicPlaneTutorial } from "client/tutorial/tutorials/BasicPlaneTutorial";
import { NewBasicPlaneTutorial } from "client/tutorial/tutorials/NewBasicPlaneTutorial";
import { TutorialServiceInitializer } from "client/tutorial/TutorialService";
import { InputController } from "engine/client/InputController";
import { Keybinds } from "engine/client/Keybinds";
import { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { Colors } from "shared/Colors";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import { PlayerDataRemotes } from "shared/remotes/PlayerDataRemotes";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import { SlotsMeta } from "shared/SlotsMeta";
import { TagUtils } from "shared/utils/TagUtils";
import { WeaponModuleSystem } from "shared/weaponProjectiles/WeaponModuleSystem";
import type { TutorialDescriber } from "client/tutorial/TutorialController";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { EffectCreator } from "shared/effects/EffectBase";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		LoadingController.run("Pre-pre-pre-init", () => {
			builder.services.registerService(RagdollController);
		});

		LoadingController.run("Waiting for server", () => {
			while (!(Workspace.HasTag(TagUtils.allTags.GAME_LOADED) as boolean | undefined)) {
				task.wait();
			}
		});

		LoadingController.run("Pre-pre-init", () => {
			const result = CustomRemotes.initPlayer.send();
			if (!result.success) {
				throw `Error while initializing the game: ${result.message}`;
			}

			const remotes = PlayerDataRemotes.fromFolder(result.remotes);
			builder.services.registerSingletonValue(remotes);
			builder.services.registerSingletonValue(remotes.building);
			builder.services.registerSingletonValue(remotes.player);
			builder.services.registerSingletonValue(remotes.slots);
			builder.services
				.registerSingletonClass(PlayerDataStorage) //
				.withArgs([PlayerDataStorage.convertData(result.data)]);
		});

		LoadingController.run("Pre-init", () => {
			LocalPlayerController.initializeDisablingFluidForces(builder);
			LocalPlayerController.initializeSprintLogic(builder);
			LocalPlayerController.initializeCameraMaxZoomDistance(builder, 512);
			OtherPlayersController.initializeMassless(builder);

			builder.services
				.registerSingletonClass(ClientEffectCreator) //
				.as<EffectCreator>();
			RemoteEvents.initializeVisualEffects(builder);

			builder.services.registerSingletonClass(Theme);
			builder.services.registerService(ThemeAutoSetter);
		});

		builder.services.registerSingletonClass(Keybinds);
		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		builder.services.registerSingletonFunc((ctx) =>
			ctx.resolve<SharedPlots>().waitForPlot(Players.LocalPlayer.UserId),
		);

		builder.services.registerSingletonFunc((ctx): ReadonlyPlot => {
			const plot = ctx.resolve<SharedPlot>();
			return new ReadonlyPlot(plot.instance.WaitForChild("Blocks"), plot.getCenter(), plot.bounds);
		});

		builder.services.registerSingletonFunc(CreateSandboxBlocks);
		PlayModeController.initialize(builder);

		builder.services
			.registerService(MainScene) //
			.autoInit();
		builder.services.registerService(ToolController);

		builder.services.registerService(FreecamController);
		builder.services.registerService(GameEnvironmentController);
		builder.services.registerService(EnvBlacklistsController);
		SoundController.initializeAll(builder);
		builder.services.registerService(ObstaclesController);
		AdminGui.initializeIfAdminOrStudio(builder);

		builder.services.registerService(DayCycleController);
		builder.services.registerService(BeaconController);
		builder.services.registerService(GraphicsSettingsController);
		builder.services.registerService(CameraController);
		builder.services.registerService(TerrainController);
		builder.services.registerService(MusicController);
		builder.services.registerService(GuiAutoScaleController);
		builder.services.registerService(HideInterfaceController);
		builder.services.registerService(WeaponModuleSystem); //weapons test
		builder.services.registerService(FpsCounterController);
		builder.services.registerService(RainbowGuiController);
		builder.services.registerService(BlurController);
		builder.services
			.registerSingletonClass(MainScreenLayout)
			.autoInit()
			.onInit((c) => c.enable());

		builder.services.registerService(UpdatePopupController);
		ChatController.initializeAdminPrefix();
		builder.services.registerService(PopupController);
		builder.services.registerSingletonValue(LogControl.instance);
		builder.services.registerService(AchievementController);

		builder.enabled.Connect((di) => {
			LogControl.instance.enable();

			InputController.inputType.subscribe((newInputType) =>
				LogControl.instance.addLine("New input type set to " + newInputType, Colors.yellow),
			);
			RemoteEvents.initialize();
			// Atmosphere.initialize();

			{
				const playerData = di.resolve<PlayerDataStorage>();
				if (playerData.config.get().autoLoad) {
					const slots = playerData.slots.get();

					const autoloadIndices = [
						SlotsMeta.autosaveSlotIndex,
						SlotsMeta.lastRunSlotIndex,
						SlotsMeta.quitSlotIndex,
					];
					const f = autoloadIndices
						.mapFiltered((c) => slots[c])
						.filter((v) => v.blocks !== 0)
						.sort(
							(l, r) =>
								(l.saveTime ?? autoloadIndices.indexOf(l.index)) >
								(r.saveTime ?? autoloadIndices.indexOf(r.index)),
						);
					$log(`Autosave load order: ${f.map((c) => c.index).join(", ")}`);

					const first = f.first();
					if (first) {
						task.spawn(() => playerData.loadPlayerSlot(first.index, `Loading ${first.name}`));
					}
				}
			}

			CustomRemotes.playerLoaded.send();
		});

		{
			const tutorials: (new (...args: any[]) => TutorialDescriber)[] = [
				BasicCarTutorial,
				NewBasicPlaneTutorial,
				BasicPlaneTutorial,
			];

			TutorialServiceInitializer.initialize(builder, {
				tutorials,
				tutorialToRunWhenNoSlots: NewBasicPlaneTutorial,
			});
		}

		// if (RunService.IsStudio() && Players.LocalPlayer.Name === "hyprlandd") {
		// 	builder.enabled.Connect((di, host) => {
		// 		const stepController = new TutorialStarter();
		// 		TestTutorial.start(stepController, true);
		// 		host.parent(stepController);
		// 	});
		// }
	}
}
