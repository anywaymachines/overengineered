import { Players } from "@rbxts/services";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { BuildingManager } from "shared/building/BuildingManager";
import { errorResponse, successResponse } from "shared/types/network/Responses";
import { PlayerUtils } from "shared/utils/PlayerUtils";

ClientBuilding.placeOperation.addMiddleware((plot, blocks) => {
	if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
		return errorResponse("Player is dead");
	}

	if (blocks.size() === 0) {
		return errorResponse("No blocks to place");
	}

	if (
		!blocks.all((block) =>
			BuildingManager.blockCanBePlacedAt(plot, BlockRegistry.map.get(block.id)!, block.location),
		)
	) {
		return errorResponse("Can't be placed here");
	}

	return successResponse;
});

/** Initializes the validation middlewares for the {@link ClientBuilding} */
export namespace ClientBuildingValidation {
	// empty function to trigger the import
	export function initialize() {}
}
