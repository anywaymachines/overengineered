type ConfigUpdateRequest = {
	readonly blocks: readonly BlockModel[];
	readonly data: {
		readonly key: string;
		readonly value: string;
	};
};

type PlayerDeleteBlockRequest = readonly BlockModel[] | "all";

type PlayerMoveRequest = {
	readonly vector: Vector3;
};

type PlaceBlockRequest = {
	readonly id: string;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly location: CFrame;
	readonly uuid?: string;
	readonly config?: Readonly<Record<keyof ConfigValueTypes, string>>;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
