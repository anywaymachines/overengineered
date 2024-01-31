import { Debris, ReplicatedStorage } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import EffectBase from "./EffectBase";

type SparksEffectArgs = undefined;
export default class SparksEffect extends EffectBase<SparksEffectArgs> {
	constructor() {
		super(UnreliableRemotes.SparksEffect);
	}

	justCreate(part: BasePart, arg?: SparksEffectArgs): void {
		const sparks = ReplicatedStorage.Assets.Sparks.Clone();
		sparks.Parent = part;

		// Delete effect
		Debris.AddItem(sparks, 1.5);
	}
}
