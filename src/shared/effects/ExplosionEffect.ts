import { Debris, ReplicatedStorage } from "@rbxts/services";
import EffectBase from "./EffectBase";

ReplicatedStorage.WaitForChild("Assets");

type Args = {
	readonly part: BasePart;
	readonly index?: number;
};
export default class ExplosionEffect extends EffectBase<Args> {
	readonly soundsFolder = ReplicatedStorage.Assets.Sounds.Explosion.GetChildren();

	constructor() {
		super("explosion_effect");
	}

	justRun({ part, index }: Args): void {
		if (!part) return;

		const soundIndex = index ?? math.random(0, this.soundsFolder.size() - 1);
		const sound = this.soundsFolder[soundIndex].Clone() as Sound;

		sound.Parent = part;
		sound.Play();

		Debris.AddItem(sound, sound.TimeLength);
	}
}
