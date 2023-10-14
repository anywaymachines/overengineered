interface Workspace {
	Plots: Folder;
}

interface Plot {
	owner: Player | undefined;
	whitelistedPlayers: Array<Player>;
	blacklistedPlayers: Array<Player>;
	__plotInstance: Model;
}
