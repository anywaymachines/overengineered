import { StarterGui, Workspace } from "@rbxts/services";
import { MusicPlaylist } from "client/controller/sound/MusicPlaylist";
import { PlayerDataStorage } from "client/PlayerDataStorage";

export namespace MusicController {
	const playlist = new MusicPlaylist(
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

	export function initialize() {
		Workspace.GetPropertyChangedSignal("Gravity").Connect(() => {
			if (PlayerDataStorage.config.get().music === false) return;

			if (Workspace.Gravity <= 0 && !playlist.currentSound) {
				playlist.play();
				return;
			}

			if (Workspace.Gravity > 0 && playlist.currentSound) {
				playlist.stop();
				return;
			}
		});
	}
}
