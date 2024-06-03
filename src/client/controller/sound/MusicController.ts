import { StarterGui, Workspace } from "@rbxts/services";
import { MusicPlaylist } from "client/controller/sound/MusicPlaylist";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStoragee } from "client/PlayerDataStorage";

@injectable
export class MusicController extends HostedService {
	private readonly playlist = new MusicPlaylist(
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

	constructor(@inject playerData: PlayerDataStoragee) {
		super();

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => {
			if (!playerData.config.get().music) return;

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
