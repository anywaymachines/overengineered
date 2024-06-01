import { Workspace } from "@rbxts/services";
import { BadgeController } from "server/BadgeController";
import { BaseGame } from "server/BaseGame";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { BlockMarkers } from "server/building/BlockMarkersController";
import { BuildingWelder } from "server/building/BuildingWelder";
import { GameInfoController } from "server/building/GameInfoController";
import { ServerBuildingRequestController } from "server/building/ServerBuildingRequestController";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { UnreliableRemoteController } from "server/network/event/UnreliableRemoteHandler";
import { PlayerDataController } from "server/PlayerDataController";
import { ServerPlots } from "server/plots/ServerPlots";
import { SharedPlots } from "shared/building/SharedPlots";
import { BlocksInitializer } from "shared/init/BlocksInitializer";
import type { BlockRegistry } from "shared/block/BlockRegistry";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		BaseGame.initialize(builder);

		builder.services.registerSingletonClass(PlayerDatabase);
		builder.services.registerSingletonClass(SlotDatabase);
		builder.services.registerService(PlayerDataController);

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		builder.services.registerSingletonFunc(BlocksInitializer.create);
		builder.services.registerService(BuildingWelder);
		builder.services.registerSingletonFunc((ctx) => BlockMarkers.initialize(ctx.resolve<BlockRegistry>()));

		builder.services.registerService(GameInfoController);
		builder.services.registerService(ServerPlots);
		PlayModeController.initialize(builder);
		builder.services.registerService(ServerBuildingRequestController);
		builder.services.registerService(ServerBlockLogicController);
		builder.services.registerService(UnreliableRemoteController);

		BadgeController.initializeIfProd(builder);
	}
}
