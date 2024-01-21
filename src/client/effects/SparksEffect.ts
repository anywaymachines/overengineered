import { ReplicatedStorage } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import ClientEffectBase from "./EffectBase";

export default class ClientSparksEffect extends ClientEffectBase<SparksEffectArgs> {
	constructor() {
		super(UnreliableRemotes.CreateSparks);
	}

	public create(part: BasePart, share: boolean = true, args?: SparksEffectArgs): void {
		super.create(part, share, args);

		const sparks = ReplicatedStorage.Assets.Sparks.Clone();
		sparks.Parent = part;

		// Delete effect
		game.GetService("Debris").AddItem(sparks, 1.5);
	}
}
