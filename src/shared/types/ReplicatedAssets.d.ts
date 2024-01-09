interface ReplicatedStorage {
	Assets: {
		Blocks: Folder;
		Axis: Model & {
			X: BasePart;
			Y: BasePart;
			Z: BasePart;
		};
		MoveHandles: MoveHandles;
		Fire: Folder;
		Sparks: ParticleEmitter;
		PlotOwnerGui: BillboardGui & {
			UserImage: ImageLabel;
			DisplayNameLabel: TextLabel;
			UsernameLabel: TextLabel;
			RankLabel: TextLabel;
		};
		Wires: Folder & {
			WireMarkerInput: BillboardGui;
			WireMarkerInputConnected: BillboardGui;
			WireMarkerOutput: BillboardGui;
			WireInfo: BillboardGui & {
				TextLabel: TextLabel;
			};
		};
		Sounds: Folder & {
			Impact: Folder & {
				Materials: Folder & {
					Metal: SoundGroup;
					Wood: SoundGroup;
				};
			};
			Effects: Folder & {
				Underwater: EqualizerSoundEffect;
			};
		};
	};
}

interface Workspace {
	ServerClockTime: NumberValue;
}

type MoveHandles = Part & {
	XHandles: Handles;
	YHandles: Handles;
	ZHandles: Handles;
	SelectionBox: SelectionBox;
};
