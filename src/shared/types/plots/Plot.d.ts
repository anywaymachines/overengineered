interface Workspace {
	readonly Plots: Folder;
}

interface PlotData {
	readonly ownerID: number;
	readonly whitelistedPlayerIDs: number[];
	readonly blacklistedPlayerIDs: number[];
}

type PlotModel = Model & {
	readonly ___nominal: "plotModel";
	readonly Blocks: PlotBlocks;
	readonly PrimaryPart: BasePart;
};

type PlotBlocks = Model & {
	readonly Parent: PlotModel;

	// using a dummy parameter to force use this function instead of the default one
	GetChildren(undef: undefined): readonly BlockModel[];
};

type BlockModel = Model & {
	readonly ___nominal: "blockModel";
};
