type ConfigUpdateRequest = {
	readonly configs: readonly {
		readonly block: BlockModel;
		readonly key: string;
		readonly value: string;
	}[];
};

type PaintRequest = ({ readonly blocks: readonly BlockModel[] } | { readonly plot: PlotModel }) & {
	readonly color?: Color3;
	readonly material?: Enum.Material;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
