import { Debris, ReplicatedStorage } from "@rbxts/services";
import EffectBase from "./EffectBase";

type Args = {
	readonly part: BasePart;
};
export default class SparksEffect extends EffectBase<Args> {
	constructor() {
		super("sparks_effect");
	}

	justRun({ part }: Args): void {
		const sparks = ReplicatedStorage.Assets.Sparks.Clone();
		sparks.Parent = part;

		// Delete effect
		Debris.AddItem(sparks, 1.5);
	}
}
