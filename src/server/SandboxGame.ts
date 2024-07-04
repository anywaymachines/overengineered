import { Workspace } from "@rbxts/services";
import { BadgeController } from "server/BadgeController";
import { BaseGame } from "server/BaseGame";
import { BlocksInitializer } from "server/blockInit/BlocksInitializer";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { GameInfoController } from "server/building/GameInfoController";
import { ServerBuildingRequestController } from "server/building/ServerBuildingRequestController";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { UnreliableRemoteController } from "server/network/event/UnreliableRemoteHandler";
import { PlayerDataController } from "server/PlayerDataController";
import { ServerPlots } from "server/plots/ServerPlots";
import { RagdollController } from "server/RagdollController";
import { SpreadingFireController } from "server/SpreadingFireController";
import { AutoLogicCreator } from "shared/block/AutoLogicCreator";
import { SharedPlots } from "shared/building/SharedPlots";
import { RemoteEvents } from "shared/RemoteEvents";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		BaseGame.initialize(builder);

		builder.services.registerSingletonClass(PlayerDatabase);
		builder.services.registerSingletonClass(SlotDatabase);
		builder.services.registerService(PlayerDataController);

		builder.services.registerSingletonClass(SpreadingFireController);
		RemoteEvents.initializeVisualEffects(builder);

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		builder.services.registerSingletonFunc(() => {
			const registry = BlocksInitializer.create();
			AutoLogicCreator.create();

			return registry;
		});

		builder.services.registerService(GameInfoController);
		builder.services.registerService(ServerPlots);
		PlayModeController.initialize(builder);
		builder.services.registerService(ServerBuildingRequestController);
		builder.services.registerService(ServerBlockLogicController);
		builder.services.registerService(UnreliableRemoteController);
		builder.services.registerService(RagdollController);

		BadgeController.initializeIfProd(builder);
	}
}
