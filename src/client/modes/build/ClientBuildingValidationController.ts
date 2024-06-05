import { Players } from "@rbxts/services";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BuildingManager } from "shared/building/BuildingManager";
import { HostedService } from "shared/GameHost";
import { errorResponse, successResponse } from "shared/types/network/Responses";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import type { BlockRegistry } from "shared/block/BlockRegistry";

@injectable
export class ClientBuildingValidationController extends HostedService {
	static initialize(host: GameHostBuilder) {
		host.services.registerService(this);
	}

	constructor(@inject blockRegistry: BlockRegistry) {
		super();

		this.event.eventHandler.register(
			ClientBuilding.placeOperation.addMiddleware((plot, blocks) => {
				if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
					return errorResponse("Player is dead");
				}

				if (blocks.size() === 0) {
					return errorResponse("No blocks to place");
				}

				if (
					!blocks.all((block) =>
						BuildingManager.blockCanBePlacedAt(plot, blockRegistry.blocks.get(block.id)!, block.location),
					)
				) {
					return errorResponse("Can't be placed here");
				}

				return successResponse;
			}),
		);
	}
}
