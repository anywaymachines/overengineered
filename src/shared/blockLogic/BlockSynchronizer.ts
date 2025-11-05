import { Players, RunService } from "@rbxts/services";
import { BidirectionalRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { ArgsSignal } from "engine/shared/event/Signal";
import { t } from "engine/shared/t";
import { CustomRemotes } from "shared/Remotes";
import { TagUtils } from "shared/utils/TagUtils";
import type { CreatableRemoteEvents } from "engine/shared/event/PERemoteEvent";
import type { BlockLogic, BlockLogicBothDefinitions } from "shared/blockLogic/BlockLogic";

/**
 * Remote event which:
 * Upon sending the value from the server, sends it to every player.
 * Upon sending the value from the client, locally executes the callback and sends it to every other player.
 * Upon a player join, sends the value to that player from the server.
 */
export class BlockSynchronizer<TArg extends { readonly block: BlockModel; reqid?: number }> {
	/** @client */
	private readonly _invoked = new ArgsSignal<[value: TArg]>();
	/** @client */
	readonly invoked = this._invoked.asReadonly();

	/** @server */
	private serverMiddleware?: (<T extends TArg>(
		invoker: Player | undefined,
		arg: T,
	) => "dontsend" | ObjectResponse<TArg>)[];
	/** @server */
	private serverMiddlewarePerPlayer?: (<T extends TArg>(
		invoker: Player | undefined,
		target: Player,
		arg: T,
	) => "dontsend" | ObjectResponse<TArg>)[];

	private readonly event;

	/** If true, sends the event to the block owner. Useful for execting server-only middlewares like text censoring. */
	sendBackToOwner = false;

	/** If set, specifies the value that's being sent to a newly joined player. */
	getExisting?: <T extends TArg = TArg>(stored: T) => TArg;

	constructor(
		private readonly name: string,
		private readonly ttype: t.Type<TArg>,
		func?: NoInfer<(arg: TArg) => void>,
		eventType: CreatableRemoteEvents = "RemoteEvent",
	) {
		const event = new BidirectionalRemoteEvent<TArg>(name, eventType);
		this.event = event;

		if (RunService.IsServer()) {
			const saved = new Map<BlockModel, TArg>();

			event.c2s.invoked.Connect((invoker, arg) => {
				//print(`[BS] [SRV] received inv  ${name}`, Strings.pretty(arg ?? {}));
				if (!t.typeCheck(arg, ttype)) {
					invoker.Kick(`Network error at ${name}`);

					const res = t.newResult();
					t.typeCheck(arg, ttype, res);
					$log(`Player ${invoker.Name} got blocksynchro error ${res.getText()}`);
					return;
				}

				if (this.serverMiddleware) {
					for (const func of this.serverMiddleware) {
						const result = func(invoker, arg);
						if (result === "dontsend") return;

						if (!result.success) {
							$err(`Error invoking synchronizer remote ${name}: ${result.message}`);
							return;
						}

						arg = result.value;
					}
				}

				if (!saved.has(arg.block)) {
					arg.block.Destroying.Connect(() => saved.delete(arg.block));
				}
				saved.set(arg.block, arg);

				for (const player of Players.GetPlayers()) {
					if (player === invoker) {
						if (!this.sendBackToOwner) continue;
						if (!player.HasTag(TagUtils.allTags.PLAYER_LOADED)) {
							continue;
						}

						event.s2c.send(player, { ...arg, reqid: arg.reqid ?? 0 });
						return;
					}

					let parg = arg;
					let send = true;
					if (this.serverMiddlewarePerPlayer) {
						for (const func of this.serverMiddlewarePerPlayer) {
							const result = func(invoker, player, arg);
							if (result === "dontsend") {
								send = false;
								continue;
							}

							if (!result.success) {
								$err(`Error invoking synchronizer remote ${name}: ${result.message}`);
								send = false;
								continue;
							}

							parg = result.value;
						}
					}
					if (!send) continue;

					//print(`[BS] [SRV] sending   ${name} to ${player.Name}`, Strings.pretty(arg ?? {}));
					event.s2c.send(player, parg);
				}
			});

			CustomRemotes.playerLoaded.invoked.Connect((player) => {
				for (const [, arg] of saved) {
					event.s2c.send(player, this.getExisting?.(arg) ?? arg);
				}
			});
		} else if (RunService.IsClient()) {
			event.s2c.invoked.Connect((arg) => {
				//print(`[BS] [CLI] receied   ${name}`, Strings.pretty(arg ?? {}));
				if (this.sendBackToOwner && "reqid" in arg && arg.reqid) {
					// reqid is being sent to owner only

					const existingState =
						(arg.block.GetAttribute(this.reqidAttributeName()) as number | undefined) ?? 0;
					if (existingState > arg.reqid) {
						// skip invoking if the request is too old
						return;
					}
				}

				this._invoked.Fire(arg);
			});
			if (func) {
				this._invoked.Connect(func);
			}
		}
	}

	private reqidAttributeName() {
		return `reqid_${this.name}`;
	}

	addServerMiddleware(
		middleware: (invoker: Player | undefined, arg: TArg) => "dontsend" | ObjectResponse<TArg>,
	): this {
		if (!RunService.IsServer()) return this;

		this.serverMiddleware ??= [];
		this.serverMiddleware.push(middleware);
		return this;
	}
	addServerMiddlewarePerPlayer(
		middleware: (invoker: Player | undefined, target: Player, arg: TArg) => "dontsend" | ObjectResponse<TArg>,
	): this {
		if (!RunService.IsServer()) return this;

		this.serverMiddlewarePerPlayer ??= [];
		this.serverMiddlewarePerPlayer.push(middleware);
		return this;
	}

	/**
	 * Check the type of arg, burn the block if wrong. Send the event if correct.
	 */
	sendOrBurn<TDef extends BlockLogicBothDefinitions>(arg: TArg, block: BlockLogic<TDef>): void {
		if (!t.typeCheck(arg, this.ttype)) {
			block.disableAndBurn();

			try {
				t.typeCheckWithThrow(arg, this.ttype);
			} catch (ex) {
				$err(ex);
			}

			return;
		}

		this.send(arg);
	}
	send(arg: TArg): void {
		if (RunService.IsServer()) {
			if (this.serverMiddleware) {
				for (const func of this.serverMiddleware) {
					const result = func(undefined, arg);
					if (result === "dontsend") return;

					if (!result.success) {
						$err(`Error invoking synchronizer remote ${this.name}: ${result.message}`);
						return;
					}

					arg = result.value;
				}
			}

			for (const player of Players.GetPlayers()) {
				if (!player.HasTag(TagUtils.allTags.PLAYER_LOADED)) {
					continue;
				}

				let parg = arg;
				let send = true;
				if (this.serverMiddlewarePerPlayer) {
					for (const func of this.serverMiddlewarePerPlayer) {
						const result = func(undefined, player, arg);
						if (result === "dontsend") {
							send = false;
							continue;
						}

						if (!result.success) {
							$err(`Error invoking synchronizer remote ${this.name}: ${result.message}`);
							send = false;
							continue;
						}

						parg = result.value;
					}
				}
				if (!send) continue;

				//print(`[BS] [SRC] sending   ${this.name} to ${player.Name}`, Strings.pretty(arg ?? {}));
				this.event.s2c.send(player, parg);
			}
		} else if (RunService.IsClient()) {
			if (this.sendBackToOwner) {
				const name = this.reqidAttributeName();
				arg.reqid = ((arg.block.GetAttribute(name) as number | undefined) ?? 0) + 1;
				arg.block.SetAttribute(name, arg.reqid);
			}

			//print(`[BS] [CLI] invoking LOCAL   ${this.name}`, Strings.pretty(arg ?? {}));
			this._invoked.Fire(arg);
			//print(`[BS] [CLI] sending REMOTE   ${this.name}`, Strings.pretty(arg ?? {}));
			this.event.c2s.send(arg);
		}
	}
}
