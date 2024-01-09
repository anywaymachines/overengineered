import Net from "@rbxts/net";
import { ReplicatedStorage } from "@rbxts/services";

const Remotes = Net.Definitions.Create({
	Player: Net.Definitions.Namespace({
		InputTypeInfo: Net.Definitions.ClientToServerEvent<[inputType: InputType]>(),
		UpdateSettings:
			Net.Definitions.ServerAsyncFunction<
				<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey]) => Response
			>(),
		FetchData: Net.Definitions.ServerAsyncFunction<() => PlayerDataResponse>(),
	}),
	Building: Net.Definitions.Namespace({
		PlaceBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlaceBlockRequest) => BuildResponse>(),
		MoveRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => Response>(),

		UpdateConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),
		UpdateLogicConnectionRequest:
			Net.Definitions.ServerAsyncFunction<(data: UpdateLogicConnectionRequest) => Response>(),

		Delete: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => Response>(),
	}),
	Slots: Net.Definitions.Namespace({
		Load: Net.Definitions.ServerAsyncFunction<(index: number) => LoadSlotResponse>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 8 }),
		]),
		Save: Net.Definitions.ServerAsyncFunction<(data: PlayerSaveSlotRequest) => SaveSlotResponse>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 60 }),
		]),
	}),
	Ride: Net.Definitions.Namespace({
		SetPlayMode: Net.Definitions.ServerAsyncFunction<(mode: PlayModes) => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 30 }),
		]),
		SetPlayModeOnClient: Net.Definitions.ClientAsyncFunction<(mode: PlayModes | undefined) => Response>(),
		Sit: Net.Definitions.ClientToServerEvent<[]>(),
	}),
	Blocks: Net.Definitions.Namespace({
		DisconnectBlock: Net.Definitions.Namespace({
			Disconnect: Net.Definitions.ClientToServerEvent<[block: Model]>(),
		}),
		TNTBlock: Net.Definitions.Namespace({
			Explode:
				Net.Definitions.ClientToServerEvent<
					[block: Model, radius: number, pressure: number, isFlammable: boolean]
				>(),
		}),
		AnchorBlock: Net.Definitions.Namespace({
			Anchor: Net.Definitions.ClientToServerEvent<[block: Model]>(),
		}),
	}),
	Debug: Net.Definitions.Namespace({
		DisplayLine: Net.Definitions.ServerToClientEvent<[text: string, isClient: boolean, isError: boolean]>(),
	}),
});

type _UnreliableRemoteEvent<T extends Callback> = Omit<UnreliableRemoteEvent<T>, "OnServerEvent"> & {
	readonly OnServerEvent: RBXScriptSignal<(player: Player, ...args: Parameters<T>) => ReturnType<T>>;
};
export const UnreliableRemotes = {
	ReplicateSound: ReplicatedStorage.FindFirstChild("ReplicateSound") as unknown as _UnreliableRemoteEvent<
		(sound: Sound, isPlaying: boolean, volume: number) => void
	>,
	ReplicateParticle: ReplicatedStorage.FindFirstChild("ReplicateParticle") as unknown as _UnreliableRemoteEvent<
		(particle: ParticleEmitter, isEnabled: boolean, acceleration: Vector3) => void
	>,

	ImpactBreak: ReplicatedStorage.FindFirstChild("ImpactBreak") as unknown as _UnreliableRemoteEvent<
		(part: BasePart) => void
	>,
	ImpactExplode: ReplicatedStorage.FindFirstChild("ImpactExplode") as unknown as _UnreliableRemoteEvent<
		(part: BasePart, blastRadius: number) => void
	>,

	Burn: ReplicatedStorage.FindFirstChild("Burn") as unknown as _UnreliableRemoteEvent<(part: BasePart) => void>,
	CreateSparks: ReplicatedStorage.FindFirstChild("CreateSparks") as unknown as _UnreliableRemoteEvent<
		(part: BasePart) => void
	>,
};

export default Remotes;
