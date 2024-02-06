interface ReplicatedStorage {
	Assets: {
		Blocks: Folder;
		CenterOfMass: Model;
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
		UsernameGui: BillboardGui & {
			DisplaynameLabel: TextLabel;
			UsernameLabel: TextLabel;
			RankLabel: TextLabel;
		};
		Wires: Folder & {
			WireMarkerInput: BillboardGui & { readonly TextButton: GuiButton };
			WireMarkerInputConnected: BillboardGui & { readonly TextButton: GuiButton };
			WireMarkerOutput: BillboardGui & { readonly TextButton: GuiButton };
			WireInfo: BillboardGui & {
				TextLabel: TextLabel;
			};
		};
		Sounds: Folder & {
			Impact: Folder & {
				Materials: Folder & {
					Metal: SoundGroup;
					Glass: SoundGroup;
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
