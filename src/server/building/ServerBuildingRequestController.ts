import { ServerBuildingRequestHandler2 } from "server/building/ServerBuildingRequestHandler2";
import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { PlayersController } from "server/player/PlayersController";
import type { Operation } from "shared/Operation";

const children = PlayersController.createContainer((player) => new ServerBuildingRequestHandler2(player));

const wrap = <TArgs extends unknown[], TRet extends {}>(
	getfunc: (handler: ServerBuildingRequestHandler2) => Operation<TArgs, TRet>,
) => {
	return (player: Player, ...args: TArgs): Response<TRet> => {
		const controller = children.get(player);
		if (!controller) {
			return PlayersController.errDestroyed;
		}

		return getfunc(controller).execute(...args);
	};
};

registerOnRemoteFunction(
	"Building",
	"PlaceBlocks",
	wrap((c) => c.placeBlocksOperation),
);

export namespace ServerBuildingRequestController {
	/** Empty function to trigger initialization */
	export function initialize() {}
}
