import { ReplicatedStorage, StarterGui, Workspace } from "@rbxts/services";
import Signals from "client/event/Signals";
import PartUtils from "shared/utils/PartUtils";
import GameEnvironmentController from "./GameEnvironmentController";
import MusicController from "./sound/MusicController";

declare type Sounds = {
	BuildingMode: {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	RideMode: {
		RideStart: Sound;
	};
	Click: Sound;
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
			this.underwater = Workspace.CurrentCamera!.CFrame.Y < 0;
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
		return this.applyPropagationPhysics(volume);
	}

	private static applyPropagationPhysics(currentLevel: number) {
		const volumePercentage = math.clamp(
			1 -
				(GameEnvironmentController.currentHeight / GameEnvironmentController.NoSoundHeight) *
					(1 - GameEnvironmentController.MinSoundValue),
			GameEnvironmentController.MinSoundValue,
			1,
		);

		return currentLevel * volumePercentage;
	}
}
