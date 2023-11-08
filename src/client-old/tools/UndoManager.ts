import { UserInputService } from "@rbxts/services";
import InputController from "client/core/InputController";
import GuiUtils from "client/utils/GuiUtils";
import Remotes from "shared/NetworkDefinitions";
import SoundUtils from "shared/utils/SoundUtils";

export default class UndoManager {
	public static blockSequence: Model[] = [];

	static {
		UserInputService.InputBegan.Connect(async (input) => {
			if (input.KeyCode === Enum.KeyCode.Z && InputController.isCtrlPressed()) {
				if (this.blockSequence.size() === 0) {
					return;
				}

				const response = await Remotes.Client.GetNamespace("Building")
					.Get("PlayerDeleteBlock")
					.CallServerAsync({
						block: this.blockSequence[this.blockSequence.size() - 1] as Model,
					});

				this.blockSequence.remove(this.blockSequence.size() - 1);

				if (response.success === true) {
					task.wait();

					const gameUI = GuiUtils.getGameUI();

					gameUI.Sounds.Building.BlockDelete.PlaybackSpeed = SoundUtils.randomSoundSpeed();
					gameUI.Sounds.Building.BlockDelete.Play();
				}
			}
		});
	}
}
