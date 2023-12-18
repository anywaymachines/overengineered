export type PlayModeControllerType = {
	getPlayerMode(player: Player): PlayModes | undefined;
	changeModeForPlayer(this: void, player: Player, mode: PlayModes | undefined): Response;
};
