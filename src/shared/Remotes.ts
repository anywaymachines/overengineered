import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Player: Net.Definitions.Namespace({
		SendChatMessage: Net.Definitions.ServerToClientEvent<[text: string, color: Color3]>(),
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
		Paint: Net.Definitions.ServerAsyncFunction<(data: PaintRequest) => Response>(),
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
export default Remotes;
