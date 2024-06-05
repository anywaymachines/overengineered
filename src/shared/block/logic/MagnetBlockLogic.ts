import { RunService } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { PartUtils } from "shared/utils/PartUtils";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { PlacedBlockData } from "shared/building/BlockManager";

const magicNumber = 60 * 1; // dt
const magnets: MagnetBlockLogic[] = [];
const forcesApplied: Map<MagnetBlockLogic, Vector3> = new Map<MagnetBlockLogic, Vector3>();

RunService.PostSimulation.Connect((dt) => {
	forcesApplied.clear();
	for (let i = 0; i < magnets.size(); i++) {
		const strength1 = magnets[i].input.strength.get() * magicNumber * dt;
		if (strength1 === 0) continue;

		for (let j = i + 1; j < magnets.size(); j++) {
			if (magnets[i].part.AssemblyRootPart === magnets[j].part.AssemblyRootPart) continue;
			const strength2 = magnets[j].input.strength.get() * magicNumber * dt;
			if (strength2 === 0) continue;

			const calculatedForce = MagnetBlockLogic.calculateForce(magnets[i], magnets[j]);
			if (!calculatedForce) continue;
			const appliedForce = calculatedForce.mul(strength1).add(calculatedForce.mul(strength2));

			forcesApplied.set(magnets[i], (forcesApplied.get(magnets[i]) ?? Vector3.zero).add(appliedForce));
			forcesApplied.set(magnets[j], (forcesApplied.get(magnets[j]) ?? Vector3.zero).add(appliedForce.mul(-1)));
		}
		const finalForce = forcesApplied.get(magnets[i]);
		if (finalForce) magnets[i].part.ApplyImpulseAtPosition(finalForce, magnets[i].part.Position);
	}
});

export class MagnetBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.magnet> {
	private static readonly partColor1 = Color3.fromRGB(128, 128, 240);
	private static readonly partColor2 = Color3.fromRGB(240, 128, 128);

	private polarity: boolean = false;
	readonly part;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.magnet);

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

		magnets.push(this);
		forcesApplied.set(this, Vector3.zero);
	}

	destroy() {
		magnets.remove(magnets.indexOf(this));
		forcesApplied.delete(this);
		super.destroy();
	}

	static calculateForce(block1: MagnetBlockLogic, block2: MagnetBlockLogic): Vector3 | undefined {
		const pos1 = block1.block.instance.GetPivot().Position;
		const pos2 = block2.block.instance.GetPivot().Position;
		const difference = pos1.sub(pos2);
		const distance = difference.Magnitude;
		if (distance > 10) return;
		const invSqrt = 1 / (1 + math.sqrt(distance));
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
