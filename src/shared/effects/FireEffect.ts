import { Debris, ReplicatedStorage } from "@rbxts/services";
import S2CRemoteEvent from "shared/event/S2CRemoteEvent";

type Args = {
	readonly part: BasePart;
	readonly duration?: number;
};
export default class FireEffect extends S2CRemoteEvent<Args> {
	constructor() {
		super("fire_effect");
	}

	justRun({ part, duration }: Args): void {
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
			Debris.AddItem(obj, duration);
		});
	}
}
