import { ServerBuildingRequestHandler2 } from "server/building/ServerBuildingRequestHandler2";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController } from "server/modes/PlayModeController";
import { PlayersController } from "server/player/PlayersController";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { ServerPlots } from "server/plots/ServerPlots";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { C2S2CRemoteFunction } from "shared/event2/PERemoteEvent";
import type { Operation } from "shared/Operation";

const children = new Map<Player, ServerBuildingRequestHandler2>();
ServerPlots.onAdded.Connect((controller) => {
	const handler = new ServerBuildingRequestHandler2(controller);

	children.set(controller.player, handler);
	handler.onDestroy(() => children.delete(controller.player));

	const savePlot = (): void => {
		const player = controller.player;
		const blocks = controller.blocks;
		const save = PlayModeController.getPlayerMode(player) === "build" && blocks.getBlocks().size() !== 0;

		if (save) {
			SlotDatabase.instance.setBlocks(
				player.UserId,
				SlotsMeta.quitSlotIndex,
				BlocksSerializer.serialize(blocks),
				blocks.getBlocks().size(),
			);
		} else {
			SlotDatabase.instance.setBlocksFromAnotherSlot(
				player.UserId,
				SlotsMeta.quitSlotIndex,
				SlotsMeta.autosaveSlotIndex,
			);
		}
	};
	controller.onDestroy(savePlot);
});

const subFunc = <TArgs extends unknown[], TRet extends {}>(
	remote: C2S2CRemoteFunction<TArgs, Response<TRet>>,
	getfunc: (handler: ServerBuildingRequestHandler2["operations"]) => Operation<TArgs, TRet>,
) => {
	remote.subscribe((player, ...args) => {
		const handler = children.get(player);
		if (!handler) return PlayersController.errDestroyed;

		return getfunc(handler.operations).execute(...args);
	});
};

const b = CustomRemotes.building;
subFunc(b.placeBlocks, (c) => c.placeBlocks);
subFunc(b.deleteBlocks, (c) => c.deleteBlocks);
subFunc(b.moveBlocks, (c) => c.moveBlocks);
subFunc(b.rotateBlocks, (c) => c.rotateBlocks);
subFunc(b.logicConnect, (c) => c.logicConnect);
subFunc(b.logicDisconnect, (c) => c.logicDisconnect);
subFunc(b.paintBlocks, (c) => c.paintBlocks);
subFunc(b.updateConfig, (c) => c.updateConfig);
subFunc(b.resetConfig, (c) => c.resetConfig);

const s = CustomRemotes.slots;
subFunc(s.load, (c) => c.loadSlot);
subFunc(s.loadImported, (c) => c.loadImportedSlot);
subFunc(s.loadAsAdmin, (c) => c.loadSlotAsAdmin);
subFunc(s.save, (c) => c.saveSlot);

export namespace ServerBuildingRequestController {
	/** Empty function to trigger initialization */
	export function initialize() {}
}
