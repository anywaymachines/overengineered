import { Debris, ReplicatedStorage } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import EffectBase from "./EffectBase";

type FireEffectArgs = {
	readonly duration?: number;
};
export default class FireEffect extends EffectBase<FireEffectArgs> {
	constructor() {
		super(UnreliableRemotes.FireEffect);
	}

	justCreate(part: BasePart, arg: FireEffectArgs): void {
		const effects = ReplicatedStorage.Assets.Fire.GetChildren();
		effects.forEach((value) => {
			const obj = value.Clone();
			obj.Parent = part;

			if (obj.IsA("Sound")) {
				if (math.random(1, 4) === 1) {
					obj.Play();
				} else {
					obj.Destroy();
					return;
				}
			}

			// Delete effect
			Debris.AddItem(obj, arg.duration);
		});
	}
}
