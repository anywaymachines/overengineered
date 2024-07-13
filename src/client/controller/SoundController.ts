import { Players, ReplicatedStorage, StarterGui, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Signals } from "client/event/Signals";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import { PartUtils } from "shared/utils/PartUtils";

type Sounds = {
	readonly Build: {
		readonly BlockPlace: Sound;
		readonly BlockPlaceError: Sound;
		readonly BlockRotate: Sound;
		readonly BlockDelete: Sound;
	};
	readonly Env: {
		readonly Ground: Sound;
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
	let isUnderwater = false;

	const groundEffectMaxHeight = RobloxUnit.Meters_To_Studs(500);
	const underwaterEffectsCache: EqualizerSoundEffect[] = [];

	export function initialize() {
		// Events
		Signals.CAMERA.MOVED.Connect(cameraMoved);

		Workspace.DescendantAdded.Connect((descendant) => {
			if (!descendant.IsA("Sound")) {
				return;
			}

			soundAdded(descendant);
		});
	}

	function soundAdded(descendant: Sound) {
		if (!isUnderwater) return;

		applyUnderwaterEffect(descendant);
	}

	function applyUnderwaterEffect(sound: Sound) {
		const effect = ReplicatedStorage.Assets.Effects.Sounds.Effects.Underwater.Clone();
		underwaterEffectsCache.push(effect);
	}

	function cleanupUnderwaterEffect() {
		for (const instance of underwaterEffectsCache) {
			instance?.Destroy();
		}
		underwaterEffectsCache.clear();
	}

	function cameraMoved() {
		// Underwater effect
		const isUnderwaterCheck = Workspace.CurrentCamera!.CFrame.Y <= TerrainDataInfo.waterLevel - 5;
		if (isUnderwaterCheck !== isUnderwater) {
			isUnderwater = isUnderwaterCheck;

			if (isUnderwater) {
				PartUtils.applyToAllDescendantsOfType("Sound", Workspace, (sound) => {
					applyUnderwaterEffect(sound);
				});
				PartUtils.applyToAllDescendantsOfType("Sound", StarterGui, (sound) => {
					applyUnderwaterEffect(sound);
				});
			} else {
				cleanupUnderwaterEffect();
			}

			return;
		}

		// Region effect
		getSounds().Env.Ground.Volume =
			(1 - (Workspace.CurrentCamera!.CFrame.Y - GameDefinitions.HEIGHT_OFFSET) / groundEffectMaxHeight) * 0.049;
	}

	export function getSounds(): Sounds {
		return (
			(Players.LocalPlayer as unknown as { PlayerGui: PlayerGui }).PlayerGui as unknown as {
				GameUI: { Sounds: Sounds };
			}
		).GameUI.Sounds;
	}

	export function getWorldVolume(volume: number) {
		return Sound.getWorldVolume(LocalPlayer.getPlayerRelativeHeight()) * volume;
	}

	export function randomSoundSpeed(): number {
		return math.random(8, 12) / 10;
	}
}
