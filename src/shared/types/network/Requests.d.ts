type ConfigUpdateRequest = {
	readonly blocks: readonly Model[];
	readonly data: {
		readonly key: string;
		readonly value: string;
	};
};

type PlayerDeleteBlockRequest = readonly Model[] | "all";

type PlayerMoveRequest = {
	readonly vector: Vector3;
};

type PlaceBlockRequest = {
	readonly block: string;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly location: CFrame;
	readonly config?: Readonly<Record<keyof ConfigValueTypes, string>>;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
