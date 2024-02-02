import Net from "@rbxts/net";
import { DefinitionsCreateResult } from "@rbxts/net/out/definitions/Types";
import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { BlockConfigDefinitions, BlockConfigDefinitionsToConfig } from "shared/BlockConfigDefinitionRegistry";
import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import Objects from "shared/fixes/objects";

type EventAfter<TArgs extends readonly unknown[]> = {
	readonly received: Signal<(...args: TArgs) => void>;
	readonly send: (...args: TArgs) => void;
};

type BlockLogicEventServerToClient<TArgs extends readonly unknown[]> = {
	readonly type: "s2c";
};
export type BlockLogicRemotes = {
	readonly [k in string]: BlockLogicEventServerToClient<readonly unknown[]>;
};

export interface BlockLogicData<TDef extends BlockConfigDefinitions, TBlock extends BlockModel = BlockModel> {
	readonly instance: TBlock;
	readonly uuid: BlockUuid;
	readonly config: Partial<BlockConfigDefinitionsToConfig<TDef>>;
	readonly color?: Color3;
	readonly material?: Enum.Material;

	/** Connections to this block INPUT from other blocks OUTPUTs and INPUTs */
	readonly connections: Readonly<Partial<Record<keyof TDef & BlockConnectionName, PlacedBlockDataConnection>>>;
}
export default abstract class SharedBlockLogic<
	TDef extends BlockConfigDefinitions,
	TRemotes extends BlockLogicRemotes,
	TBlock extends BlockModel = BlockModel,
> {
	private readonly remotes;

	constructor(block: BlockLogicData<BlockConfigDefinitions>) {
		//
		//Net.Definitions.Create();

		const toRemote = (remote: TRemotes[keyof TRemotes]) => {
			if (remote.type === "s2c") {
				return Net.Definitions.ServerToClientEvent();
			}

			throw "Unknown type";
		};

		this.remotes = Objects.fromEntries(
			Objects.entries(this.getRemotes()).map(([key, remote]) => [key as string, toRemote(remote)] as const),
		);
	}

	protected abstract getRemotes(): TRemotes;
}

type RemoteS2C<TArgs extends readonly unknown[]> = {
	readonly type: "s2c";
	readonly args: TArgs;
};
type TRemotes = {
	readonly [k in string]: RemoteS2C<readonly unknown[]>;
};
type TRemotesToRemotes<T extends Readonly<Record<string, RemoteS2C<readonly unknown[]>>>> = {
	readonly [k in keyof T]: {
		readonly type: T[k]["type"];
	};
};

abstract class TBlock<T extends TRemotes> {
	private static readonly net = new Map<string, DefinitionsCreateResult<{}>>();

	private readonly owner: number | 0;

	protected readonly remotesDefinition: TRemotesToRemotes<T>;
	//protected readonly remotes;

	constructor() {
		this.owner = Players.LocalPlayer.UserId;
		this.remotesDefinition = this.getRemotes();

		const defToRemote = <TKey extends keyof T>(remote: Exclude<TRemotesToRemotes<T>[TKey], undefined>) => {
			if (remote.type === "s2c") {
				return {
					called: new Signal<(...args: T[TKey]["args"]) => void>(),
					event: Net.Definitions.ServerToClientEvent(),
				} as const;
			}

			throw "Unknown type";
		};

		const remotes = Objects.fromEntries(
			Objects.entries(this.remotesDefinition).map(
				([key, remote]) => [key as string, defToRemote(remote)] as const,
			),
		);
	}

	protected onRemote<TKey extends keyof T>(key: TKey, func: (...args: T[TKey]["args"]) => void) {
		//
	}
	protected send<TKey extends keyof T>(key: TKey, ...args: T[TKey]["args"]) {
		if (RunService.IsServer()) throw "what no go away";

		if (this.owner === Players.LocalPlayer.UserId) {
			//
		}
	}

	protected abstract getRemotes(): TRemotesToRemotes<T>;
}

type TARemotes = {
	readonly test: RemoteS2C<[data: string]>;
};
class Zack extends TBlock<TARemotes> {
	constructor() {
		super();

		/*if (RunService.IsClient()) {
			this.remotes.Client.Get("test").CallServerAsync();
		}

		const a = {
			test: {},
		} as const;

		this.onRemote("test", (data: string) => {
			print(data);
		});

		on("test", () => {
			explode();
		});*/
	}

	protected getRemotes(): TRemotesToRemotes<TARemotes> {
		return {
			test: {
				type: "s2c",
			},
		};
	}
}
