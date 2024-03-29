import { StarterGui, Workspace } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import MusicPlaylist from "./MusicPlaylist";

export default class MusicController {
	private static playlist = new MusicPlaylist(
		(
			StarterGui as unknown as {
				GameUI: {
					Sounds: Folder & {
						Music: Folder & {
							Space: Folder;
						};
					};
				};
			}
		).GameUI.Sounds.Music.Space.GetChildren() as Sound[],
		15,
	);

	static initialize() {
		Workspace.GetPropertyChangedSignal("Gravity").Connect(() => {
			if (PlayerDataStorage.config.get().music === false) return;

			if (Workspace.Gravity <= 0 && !this.playlist.currentSound) {
				this.playlist.play();
				return;
			}

			if (Workspace.Gravity > 0 && this.playlist.currentSound) {
				this.playlist.stop();
				return;
			}
		});
	}
}
