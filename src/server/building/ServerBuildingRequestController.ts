import { ServerBuildingRequestHandler } from "server/building/ServerBuildingRequestHandler";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlots } from "server/plots/ServerPlots";
import type { DIContainer } from "shared/DI";
import type { C2S2CRemoteFunction } from "shared/event2/PERemoteEvent";
import type { Operation2 } from "shared/Operation";

@injectable
export class ServerBuildingRequestController extends HostedService {
	constructor(
		@inject serverPlots: ServerPlots,
		@inject playModeController: PlayModeController,
		@inject slots: SlotDatabase,
		@inject container: DIContainer,
	) {
		super();
		container = container.beginScope();

		const children = new Map<Player, ServerBuildingRequestHandler>();
		this.event.subscribeCollection(
			serverPlots.controllers,
			(update) => {
				if (update.kind !== "add") return;

				for (const controller of update.added) {
					container = container.beginScope();
					container.registerSingleton(controller);
					const handler = container.resolveForeignClass(ServerBuildingRequestHandler);

					children.set(controller.player, handler);
					handler.onDestroy(() => children.delete(controller.player));

					const savePlot = (): void => {
						const player = controller.player;
						const blocks = controller.blocks;
						const save =
							playModeController.getPlayerMode(player) === "build" && blocks.getBlocks().size() !== 0;

						if (save) {
							slots.setBlocks(
								player.UserId,
								SlotsMeta.quitSlotIndex,
								BlocksSerializer.serialize(blocks),
								blocks.getBlocks().size(),
							);
						} else {
							slots.setBlocksFromAnotherSlot(
								player.UserId,
								SlotsMeta.quitSlotIndex,
								SlotsMeta.autosaveSlotIndex,
							);
						}
					};
					controller.onDestroy(savePlot);
				}
			},
			true,
		);

		const subFunc = <TArg extends object & { readonly [k in string]: unknown }, TRet extends {}>(
			remote: C2S2CRemoteFunction<[arg: TArg], Response<TRet>>,
			getfunc: (handler: ServerBuildingRequestHandler["operations"]) => Operation2<TArg, TRet>,
		) => {
			remote.subscribe((player, ...args) => {
				const handler = children.get(player);
				if (!handler) return PlayerWatcher.errDestroyed;

				$trace("Executing remote", getfunc(handler.operations), "with args", ...args);
				return getfunc(handler.operations).execute(...args);
			});
		};

		const b = CustomRemotes.building;
		subFunc(b.placeBlocks, (c) => c.placeBlocks);
		subFunc(b.deleteBlocks, (c) => c.deleteBlocks);
		subFunc(b.editBlocks, (c) => c.editBlocks);
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
	}
}
