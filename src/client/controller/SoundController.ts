import { ReplicatedStorage, StarterGui, Workspace } from "@rbxts/services";
import { Signals } from "client/event/Signals";
import { Sound } from "shared/Sound";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import { PartUtils } from "shared/utils/PartUtils";
import { GameEnvironmentController } from "./GameEnvironmentController";
import { MusicController } from "./sound/MusicController";

type Sounds = {
	readonly Build: {
		readonly BlockPlace: Sound;
		readonly BlockPlaceError: Sound;
		readonly BlockRotate: Sound;
		readonly BlockDelete: Sound;
	};
	readonly Start: Sound;
	readonly Click: Sound;
	readonly Warning: Sound;
	readonly Music: {
		readonly Space: Folder & { [key: string]: Sound };
	};
};

/** A class for controlling sounds and their effects */
export namespace SoundController {
	let underwater = false;

	export function initialize() {
		MusicController.initialize();

		Signals.CAMERA.MOVED.Connect(() => {
			const newState = Workspace.CurrentCamera!.CFrame.Y <= TerrainDataInfo.waterLevel - 5;
			if (newState === underwater) return;

			underwater = newState;
			updateAllSounds();
		});

		Workspace.DescendantAdded.Connect((descendant) => {
			if (!underwater) {
				return;
			}
			if (!descendant.IsA("Sound")) {
				return;
			}
			updateSound(descendant);
		});

		/** Preload all sound assets */
		const sounds = ReplicatedStorage.Assets.GetDescendants().filter((value) => value.IsA("Sound")) as Sound[];
		const list: string[] = [];

		sounds.forEach((sound) => {
			list.push(sound.SoundId);
		});

		game.GetService("ContentProvider").PreloadAsync(list);
	}

	function updateSound(sound: Sound) {
		const underwaterEffect = sound.FindFirstChild(ReplicatedStorage.Assets.Effects.Sounds.Effects.Underwater.Name);
		if (underwater && !underwaterEffect) {
			ReplicatedStorage.Assets.Effects.Sounds.Effects.Underwater.Clone().Parent = sound;
		} else if (!underwater && underwaterEffect) {
			underwaterEffect.Destroy();
		}
	}

	function updateAllSounds() {
		PartUtils.applyToAllDescendantsOfType("Sound", StarterGui, (sound) => {
			updateSound(sound);
		});
		PartUtils.applyToAllDescendantsOfType("Sound", Workspace, (sound) => {
			updateSound(sound);
		});
	}

	export function getSounds(): Sounds {
		return (StarterGui as unknown as { GameUI: { Sounds: Sounds } }).GameUI.Sounds;
	}

	export function randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}

	export function getWorldVolume(volume: number) {
		return Sound.getWorldVolume(GameEnvironmentController.currentHeight) * volume;
	}
}
