import { Debris, ReplicatedStorage } from "@rbxts/services";
import S2CRemoteEvent from "./effects/S2CRemoteEvent";

type SparksEffectArgs = {
	readonly part: BasePart;
};
class SparksEffect extends S2CRemoteEvent<SparksEffectArgs> {
	private readonly asset = ReplicatedStorage.Assets.Sparks;

	constructor() {
		super("sparks");
	}

	justRun({ part }: SparksEffectArgs): void {
		const sparks = this.asset.Clone();
		sparks.Parent = part;

		// Delete effect
		Debris.AddItem(sparks, 1.5);
	}
}

//

const RemoteEvents = {
	Sparks: new SparksEffect(),

	// empty method just to trigger constructors
	initialize() {},
} as const;
export default RemoteEvents;
