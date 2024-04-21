import { Debris, ReplicatedStorage } from "@rbxts/services";
import { EffectBase } from "./EffectBase";

ReplicatedStorage.WaitForChild("Assets");

type Args = {
	readonly part: BasePart;
	readonly index?: number;
};
export class ImpactSoundEffect extends EffectBase<Args> {
	private readonly materialSounds: { readonly [key: string]: Instance[] } = {
		Default: ReplicatedStorage.Assets.Effects.Sounds.Impact.Materials.Metal.GetChildren(),

		Metal: ReplicatedStorage.Assets.Effects.Sounds.Impact.Materials.Metal.GetChildren(),
		Glass: ReplicatedStorage.Assets.Effects.Sounds.Impact.Materials.Glass.GetChildren(),
		Wood: ReplicatedStorage.Assets.Effects.Sounds.Impact.Materials.Wood.GetChildren(),
		WoodPlanks: ReplicatedStorage.Assets.Effects.Sounds.Impact.Materials.Wood.GetChildren(),
	};

	constructor() {
		super("impact_sound_effect");
	}

	justRun({ part, index }: Args): void {
		if (!part) return;

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
