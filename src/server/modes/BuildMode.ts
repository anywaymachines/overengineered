import PlayModeBase from "./PlayModeBase";

export default class BuildMode implements PlayModeBase {
	onTransitionFrom(player: Player, prevmode: PlayModes | undefined) {
		if (prevmode === undefined || prevmode === "ride") {
			return { success: true };
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined) {
		if (nextmode === undefined || nextmode === "ride") {
			return { success: true };
		}
	}
}
