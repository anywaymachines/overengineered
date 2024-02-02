import { Debris, ReplicatedStorage } from "@rbxts/services";
import S2CRemoteEvent from "shared/event/S2CRemoteEvent";

type Args = {
	readonly part: BasePart;
	readonly index?: number;
};
export default class ImpactSoundEffect extends S2CRemoteEvent<Args> {
	private readonly materialSounds: { [key: string]: Instance[] } = {
		Default: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal.GetChildren(),

		Metal: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal.GetChildren(),
		Glass: ReplicatedStorage.Assets.Sounds.Impact.Materials.Glass.GetChildren(),
		Wood: ReplicatedStorage.Assets.Sounds.Impact.Materials.Wood.GetChildren(),
	};

	constructor() {
		super("impact_sound_effect");
	}

	justRun({ part, index }: Args): void {
		const soundsFolder = this.materialSounds[part.Material.Name] ?? this.materialSounds["Default"];
		const soundIndex = index ?? math.random(0, soundsFolder.size() - 1);
		const sound = soundsFolder[soundIndex].Clone() as Sound;

		sound.RollOffMaxDistance = 1000;
		sound.Volume = 0.5;
		sound.Parent = part;
		sound.Play();

		Debris.AddItem(sound, sound.TimeLength);
	}
}
