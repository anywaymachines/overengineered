interface ReplicatedStorage {
	Assets: Folder & {
		Atmosphere: Folder & {
			AtmosphericExtinction: Model & {
				AtmosphericExtinction1: Part & {
					Attachment1a: Attachment;
					Attachment2b: Attachment;
					Attachment3a: Attachment;
					Attachment4b: Attachment;
					Attachment5a: Attachment;
					Attachment6b: Attachment;
					Attachment7a: Attachment;
					Attachment8b: Attachment;
				};
				AtmosphericExtinction2: Part & {
					Attachment1b: Attachment;
					Attachment2a: Attachment;
					Attachment3b: Attachment;
					Attachment4a: Attachment;
					Attachment5b: Attachment;
					Attachment6a: Attachment;
					Attachment7b: Attachment;
					Attachment8a: Attachment;

					Beam1: Beam;
					Beam2: Beam;
					Beam3: Beam;
					Beam4: Beam;
					Beam5: Beam;
					Beam6: Beam;
					Beam7: Beam;
					Beam8: Beam;
					Beam9: Beam;
					Beam10: Beam;
					Beam11: Beam;
					Beam12: Beam;
				};
			};
			AtmosphericExtinctionSunset: Model;
			Sun3D: Part & {
				Mesh: FileMesh;
				SunsetLight: BillboardGui & {
					Light: ImageLabel;
				};
			};
		};
		CenterOfMass: Model;
		Placeable: Folder;
		Axis: Model & {
			X: BasePart;
			Y: BasePart;
			Z: BasePart;
		};
		MoveHandles: MoveHandles;
		RotateHandles: RotateHandles;
		Effects: Folder & {
			Fire: Folder;
			Explosion: Folder;
			Sparks: ParticleEmitter;
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
				Explosion: Folder & { [key: string]: Sound };
			};
		};
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
			readonly WireMarker: BillboardGui & {
				readonly TextButton: GuiButton & {
					readonly White: Frame;
					readonly Filled: Frame;
				};
			};
			WireInfo: BillboardGui & {
				TextLabel: TextLabel;
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

type RotateHandles = Part & {
	readonly ArcHandles: ArcHandles;
	readonly SelectionBox: SelectionBox;
	readonly Center: BasePart;
};
