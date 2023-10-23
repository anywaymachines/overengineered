interface Workspace {
	Plots: Folder;
}

interface Plot {
	ownerID: number;
	whitelistedPlayerIDs: number[];
	blacklistedPlayerIDs: number[];
}
