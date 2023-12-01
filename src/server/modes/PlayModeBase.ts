export default interface PlayModeBase {
	/** Returns a response, or undefined if the transition is invalid */
	onTransitionFrom(player: Player, prevmode: PlayModes | undefined): Response | undefined;

	/** Returns a response, or undefined if the transition is invalid */
	onTransitionTo(player: Player, nextmode: PlayModes | undefined): Response | undefined;
}
