import { Workspace } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import GameEnvironmentController from "../GameEnvironmentController";
import GuiController from "../GuiController";
import MusicPlaylist from "./MusicPlaylist";

export default class MusicController {
	private static playlist = new MusicPlaylist(
		GuiController.getGameUI<{
			Sounds: Folder & {
				Music: Folder & {
					Space: Folder;
				};
			};
		}>().Sounds.Music.Space.GetChildren() as Sound[],
		15,
	);

	public static initialize() {
		Workspace.GetPropertyChangedSignal("Gravity").Connect(() => {
			if (!PlayerDataStorage.config.get().music) return;

			if (Workspace.Gravity <= GameEnvironmentController.NoGravityGravity * 2 && !this.playlist.currentSound) {
				this.playlist.play();
				return;
			}

			if (Workspace.Gravity > GameEnvironmentController.NoGravityGravity * 2 && this.playlist.currentSound) {
				this.playlist.stop();
				return;
			}
		});
	}
}
