import { Workspace } from "@rbxts/services";
import { BadgeController } from "server/BadgeController";
import { BaseGame } from "server/BaseGame";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { BlockMarkersController } from "server/building/BlockMarkersController";
import { BuildingWelder } from "server/building/BuildingWelder";
import { GameInfoController } from "server/building/GameInfoController";
import { ServerBuildingRequestController } from "server/building/ServerBuildingRequestController";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { ServerPlots } from "server/plots/ServerPlots";
import { Controller } from "shared/component/Controller";
import { BlocksInitializer } from "shared/init/BlocksInitializer";
import type { DIContainer } from "shared/DI";

@injectable
export class SandboxGame extends Controller {
	constructor(@inject di: DIContainer) {
		super();

		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		this.parent(di.regResolve(BaseGame));
		di.registerSingleton(BlocksInitializer.create());
		this.parent(di.regResolve(BuildingWelder));

		this.parent(di.regResolve(BlockMarkersController));
		this.parent(di.regResolve(GameInfoController));

		this.parent(di.regResolve(ServerPlots));
		this.parent(di.regResolve(PlayModeController));
		this.parent(di.regResolve(ServerBuildingRequestController));
		this.parent(di.regResolve(ServerBlockLogicController));

		BadgeController.initializeIfProd(this, di);
	}
}
