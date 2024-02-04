import { ReplicatedStorage, StarterGui, Workspace } from "@rbxts/services";
import Signals from "client/event/Signals";
import Sound from "shared/Sound";
import TerrainDataInfo from "shared/TerrainDataInfo";
import PartUtils from "shared/utils/PartUtils";
import GameEnvironmentController from "./GameEnvironmentController";
import MusicController from "./sound/MusicController";

declare type Sounds = {
	Build: {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	Start: Sound;
	Click: Sound;
	Warning: Sound;
	Music: {
		Space: Folder & { [key: string]: Sound };
	};
};

/** A class for controlling sounds and their effects */
export default class SoundController {
	private static underwater = false;

	public static initialize() {
		MusicController.initialize();

		Signals.CAMERA.MOVED.Connect(() => {
			const newState = Workspace.CurrentCamera!.CFrame.Y <= TerrainDataInfo.getData().waterHeight - 5;
			if (newState === this.underwater) return;

			this.underwater = newState;
			this.updateAllSounds();
		});

		Workspace.DescendantAdded.Connect((descendant) => {
			if (!this.underwater) {
				return;
			}
			if (!descendant.IsA("Sound")) {
				return;
			}
			this.updateSound(descendant);
		});
	}

	private static updateSound(sound: Sound) {
		const underwaterEffect = sound.FindFirstChild(ReplicatedStorage.Assets.Sounds.Effects.Underwater.Name);
		if (this.underwater && !underwaterEffect) {
			ReplicatedStorage.Assets.Sounds.Effects.Underwater.Clone().Parent = sound;
		} else if (!this.underwater && underwaterEffect) {
			underwaterEffect.Destroy();
		}
	}

	private static updateAllSounds() {
		PartUtils.applyToAllDescendantsOfType("Sound", StarterGui, (sound) => {
			this.updateSound(sound);
		});
		PartUtils.applyToAllDescendantsOfType("Sound", Workspace, (sound) => {
			this.updateSound(sound);
		});
	}

	public static getSounds(): Sounds {
		return (StarterGui as unknown as { GameUI: { Sounds: Sounds } }).GameUI.Sounds;
	}

	public static randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}

	public static getWorldVolume(volume: number) {
		return Sound.getWorldVolume(GameEnvironmentController.currentHeight) * volume;
	}
}
