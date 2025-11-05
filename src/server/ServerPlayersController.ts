import { Players, ServerStorage } from "@rbxts/services";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { HostedService } from "engine/shared/di/HostedService";
import { Lock } from "engine/shared/fixes/Lock";
import { PlayerWatcher } from "engine/shared/PlayerWatcher";
import { t } from "engine/shared/t";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { ServerSlotRequestController } from "server/building/ServerSlotRequestController";
import { PlayerBanned, ServerError } from "server/database/PlayerDatabase";
import { asPlayerId } from "server/PlayerId";
import { ServerPlayerController } from "server/ServerPlayerController";
import { ServerPlayerDataRemotesController } from "server/ServerPlayerDataRemotesController";
import { CustomRemotes } from "shared/Remotes";
import { TagUtils } from "shared/utils/TagUtils";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { PlayerInitResponse } from "shared/Remotes";

@injectable
export class ServerPlayersController extends HostedService {
	readonly controllers;

	constructor(
		@inject readonly players: PlayerDatabase,
		@inject sharedPlots: SharedPlots,
		@inject di: DIContainer,
	) {
		super();

		const controllers = this.parent(new ComponentKeyedChildren<number, ServerPlayerController>(true));
		this.controllers = controllers.children;

		const initPlayerLock = new Lock();
		this.event.subscribeRegistration(() =>
			CustomRemotes.initPlayer.subscribe((player): Response<PlayerInitResponse> => {
				const shadowBan = () => {
					ServerStorage.FindFirstChild("ShadowBan")!.Clone().Parent = (
						player as unknown as { PlayerGui: PlayerGui }
					).PlayerGui;
				};

				const cresult = initPlayerLock.execute((): Response<{ controller: ServerPlayerController }> => {
					if (controllers.getAll().has(player.UserId)) {
						task.spawn(() => player.Kick("hi  i like your hair"));
						controllers.remove(player.UserId);

						return { success: false, message: "no" };
					}

					let plot = sharedPlots.plots.find((p) => p.ownerId.get() === undefined);
					if (!plot) {
						// clean all plots
						for (const plot of sharedPlots.plots) {
							const ownerId = plot.ownerId.get();
							if (!ownerId) {
								// WHAT
								break;
							}

							if (!Players.GetPlayerByUserId(ownerId)) {
								plot.ownerId.set(undefined);
							}
						}

						// kick duplicates
						const duplicates = sharedPlots.plots
							.groupBy((c) => c.ownerId.get() ?? -1)
							.filter((k, c) => k !== -1 && c.size() > 1);
						for (const [id] of duplicates) {
							Players.GetPlayerByUserId(id)?.Kick();
						}

						plot = sharedPlots.plots.find((p) => p.ownerId.get() === undefined);
						if (!plot) {
							task.spawn(() => {
								while (true as boolean) {
									task.wait();
									for (const player of Players.GetPlayers()) {
										player.Kick("Updating the game...");
									}
								}
							});

							return { success: false, message: "No free plot found, try again later." };
						}
					}

					const scope = di.beginScope((builder) => {
						builder.registerSingletonValue(player);
						builder.registerSingletonValue(plot);
						builder.registerSingletonClass(ServerPlayerController);
					});

					const controller = scope.resolveForeignClass(ServerPlayerController, [player, plot]);
					controllers.add(player.UserId, controller);
					player.AddTag(TagUtils.allTags.PLAYER_LOADED);

					return { success: true, controller };
				});

				if (!cresult.success) return cresult;
				const controller = cresult.controller;

				let data;
				try {
					data = players.get(player.UserId) ?? {};

					return {
						success: true,
						remotes: controller.remotesFolder,
						data: {
							purchasedSlots: data.purchasedSlots,
							settings: data.settings,
							slots: data.slots,
							data: data.data,
							features: data.features,
							achievements: data.achievements,
						},
					};
				} catch (err) {
					if (t.typeCheck(err, PlayerBanned)) {
						const secondsToText = (msuntil: number): string => {
							const intervals = [
								{ label: "year", seconds: 31536000 },
								{ label: "month", seconds: 2592000 },
								{ label: "day", seconds: 86400 },
								{ label: "hour", seconds: 3600 },
								{ label: "minute", seconds: 60 },
								{ label: "second", seconds: 1 },
							];

							const seconds = (msuntil - DateTime.now().UnixTimestampMillis) / 1000;
							for (const interval of intervals) {
								const count = math.floor(seconds / interval.seconds);
								if (count >= 1) {
									return `${count} ${interval.label}${count !== 1 ? "s" : ""} left`;
								}
							}

							return "ඞ";
						};

						const data = err;
						if (!data.reason.contains("bye bye")) {
							player.Kick(
								`You are ${data.until ? "" : "permanently "}banned!\n${data.reason}${data.until && `\n${secondsToText(data.until)}`}`,
							);
							return { success: false, message: "ban haha" };
						}

						shadowBan();
						return { success: false, message: "no" };
					}

					let msg: string;
					if (t.typeCheck(err, ServerError)) {
						msg =
							err.message ??
							`The server is currently unavailable, try again later. Error code ${err.errorCode}`;
					} else {
						msg = "The server is currently unavailable, try again later.";
					}

					player.Kick(msg);
					return { success: false, message: msg };
				}
			}),
		);
		this.event.subscribeRegistration(() =>
			CustomRemotes.adminDataFor.subscribe((sender, playerId): Response<PlayerInitResponse> => {
				if (isNotAdmin_AutoBanned(sender, "adminDataFor")) {
					return { success: false, message: "no" };
				}

				const controller = this.controllers.get(sender.UserId);
				if (!controller) {
					return { success: false, message: "you are LITERALLY offline" };
				}

				const scope = di.beginScope((builder) => {
					builder.registerSingletonValue(asPlayerId(playerId));
				});

				const spdrc = ServerPlayerDataRemotesController.create(scope, playerId, sender);
				spdrc.enable();

				spdrc.parent(
					new ServerSlotRequestController(
						asPlayerId(playerId),
						spdrc.slotRemotes,
						controller.plotController.blocks,
						scope.resolve<BlockList>(),
						scope.resolve<PlayerDatabase>(),
						scope.resolve<SlotDatabase>(),
					),
				);

				const data = players.get(playerId) ?? {};

				return {
					success: true,
					remotes: spdrc.remotesFolder,
					data: {
						purchasedSlots: data.purchasedSlots,
						settings: data.settings,
						slots: data.slots,
						data: data.data,
						features: data.features,
						achievements: data.achievements,
					},
				};
			}),
		);

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onQuit((player) => {
				controllers.remove(player.UserId);
			}),
		);

		game.BindToClose(() => {
			$log("Game quit, destroying controllers...");

			for (const [playerId, controller] of controllers.getAll()) {
				$log(`Destroying controller of ${playerId}`);
				controller.destroy();
			}
		});
	}

	getPlayers(): readonly Player[] {
		return this.controllers
			.getAll()
			.keys()
			.mapFiltered((id) => Players.GetPlayerByUserId(id));
	}
}
