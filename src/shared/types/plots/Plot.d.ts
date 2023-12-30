interface Workspace {
	Plots: Folder;
	Atmosphere: Model; // TODO: Move
}

interface Plot {
	ownerID: number;
	whitelistedPlayerIDs: number[];
	blacklistedPlayerIDs: number[];
}
