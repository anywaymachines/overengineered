import { RunService } from "@rbxts/services";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";

export default class MagnetBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.magnet> {
	private static readonly magnetsMap = new Map<string, MagnetBlockLogic>();
	private static readonly partColor1 = Color3.fromRGB(128, 128, 240);
	private static readonly partColor2 = Color3.fromRGB(240, 128, 128);

	private polarity: boolean = false;
	private readonly part;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.magnet);

		MagnetBlockLogic.magnetsMap.set(this.block.uuid, this);
		this.part = this.block.instance.WaitForChild("Part") as BasePart;

		this.event.subscribeObservable(
			this.input.invertPolarity,
			(isInverted) => {
				this.polarity = isInverted;
				PartUtils.applyToAllDescendantsOfType(
					"BasePart",
					this.block.instance,
					(part) => (part.Color = isInverted ? MagnetBlockLogic.partColor1 : MagnetBlockLogic.partColor2),
				);
			},
			true,
		);

		this.event.subscribe(RunService.Heartbeat, () => {
			const magicNumber = 5;
			const strength = this.input.strength.get() * magicNumber;
			if (strength === 0) return;
			let attractedTo = Vector3.zero;
			for (const [uuid, someMagnet] of MagnetBlockLogic.magnetsMap) {
				if (uuid === this.block.uuid) continue;
				//const distanceBetween = this.instance.GetPivot().Position.sub(someMagnet.instance.GetPivot().Position).Magnitude;
				const calculatedForce: Vector3 = MagnetBlockLogic.calculateForce(this, someMagnet);
				attractedTo = attractedTo.add(calculatedForce);
			}

			const result = attractedTo.mul(strength);
			this.part.ApplyImpulseAtPosition(result, this.part.Position);
		});
	}

	destroy() {
		MagnetBlockLogic.magnetsMap.delete(this.block.uuid);
		super.destroy();
	}

	private static calculateForce(block1: MagnetBlockLogic, block2: MagnetBlockLogic): Vector3 {
		const pos1 = block1.block.instance.GetPivot().Position;
		const pos2 = block2.block.instance.GetPivot().Position;
		const difference = pos1.sub(pos2);
		const distance = difference.Magnitude;
		if (distance > 10) return Vector3.zero;

		const invSqrt = 1 / (1 + math.pow(distance, 1 / 2));
		const isAttracted = block1.polarity === block2.polarity;
		const result = VectorUtils.normalizeVector3(difference).mul(isAttracted ? invSqrt : -invSqrt);

		//distance between
		//inverse square root
		//make it minus value if
		//multiply by normalized value?
		//???
		//profit!!

		return result;
	}
}
