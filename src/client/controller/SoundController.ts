import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Signals } from "client/event/Signals";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import { PartUtils } from "shared/utils/PartUtils";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

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

@injectable
class UnderwaterSoundEffect extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage) {
		super();

		const underwaterEffectsCache: EqualizerSoundEffect[] = [];
		const applyUnderwaterEffect = (sound: Sound) => {
			const effect = ReplicatedStorage.Assets.Effects.Sounds.Effects.Underwater.Clone();
			effect.Parent = sound;
			underwaterEffectsCache.push(effect);
		};
		const cleanupUnderwaterEffect = () => {
			for (const instance of underwaterEffectsCache) {
				instance?.Destroy();
			}
			underwaterEffectsCache.clear();
		};

		let isUnderwater = false;
		const cameraMoved = () => {
			const terrainType = playerDataStorage.config.get().terrain.kind;
			if (terrainType !== "Classic" && terrainType !== "Water") {
				return;
			}

			// Underwater effect
			const isUnderwaterCheck = Workspace.CurrentCamera!.CFrame.Y <= TerrainDataInfo.waterLevel + 5;
			if (isUnderwaterCheck !== isUnderwater) {
				isUnderwater = isUnderwaterCheck;

				if (isUnderwater) {
					PartUtils.applyToAllDescendantsOfType("Sound", Workspace, (sound) => {
						applyUnderwaterEffect(sound);
					});
					PartUtils.applyToAllDescendantsOfType(
						"Sound",
						(Players.LocalPlayer as unknown as { PlayerGui: PlayerGui }).PlayerGui,
						(sound) => {
							applyUnderwaterEffect(sound);
						},
					);
				} else {
					cleanupUnderwaterEffect();
				}

				return;
			}
		};

		this.event.subscribe(Signals.CAMERA.MOVED, cameraMoved);
		this.event.subscribeRegistration(() =>
			SoundController.subscribeSoundAdded((sound) => {
				if (!isUnderwater) return;
				applyUnderwaterEffect(sound);
			}),
		);
	}
}

class DecreaseVolumeWithAltitude extends HostedService {
	constructor() {
		super();

		const groundEffectMaxHeight = RobloxUnit.Meters_To_Studs(500);

		const cameraMoved = () => {
			SoundController.getSounds().Env.Ground.Volume =
				(1 - (Workspace.CurrentCamera!.CFrame.Y - GameDefinitions.HEIGHT_OFFSET) / groundEffectMaxHeight) *
				0.06;
		};
		Signals.CAMERA.MOVED.Connect(cameraMoved);
	}
}

/** A class for controlling sounds and their effects */
export namespace SoundController {
	export function initializeAll(host: GameHostBuilder) {
		initializeUnderwaterEffect(host);
		initializeVolumeAltitudeDecrease(host);
	}
	export function initializeUnderwaterEffect(host: GameHostBuilder) {
		host.services.registerService(UnderwaterSoundEffect);
	}
	export function initializeVolumeAltitudeDecrease(host: GameHostBuilder) {
		host.services.registerService(DecreaseVolumeWithAltitude);
	}

	export function subscribeSoundAdded(func: (sound: Sound) => void): SignalConnection {
		const connection = Workspace.DescendantAdded.Connect((sound) => {
			if (!sound.IsA("Sound")) return;
			func(sound);
		});

		for (const instance of Workspace.GetDescendants()) {
			if (!instance.IsA("Sound")) continue;
			func(instance);
		}

		return connection;
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
