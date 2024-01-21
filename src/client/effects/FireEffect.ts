import { ReplicatedStorage } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import ClientEffectBase from "./EffectBase";

export default class ClientFireEffect extends ClientEffectBase<FireEffectArgs> {
	constructor() {
		super(UnreliableRemotes.FireEffect);
	}

	public create(part: BasePart, share: boolean = true, args: FireEffectArgs): void {
		super.create(part, share, args);

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
			game.GetService("Debris").AddItem(obj, args.duration);
		});
	}
}
