import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PistonLogic } from "shared/block/logic/PistonBlockLogic";

export class PistonBlockServerLogic extends ServerBlockLogic<typeof PistonLogic> {
	constructor(logic: typeof PistonLogic) {
		super(logic);

		logic.events.updatePosition.invoked.Connect((player, { block, position }) => {
			if (!this.isValidBlock(block, player)) return;

			const bottomPart = block.FindFirstChild("Bottom") as Part | undefined;
			if (!bottomPart) return;

			const prism = bottomPart.FindFirstChild("PrismaticConstraint") as PrismaticConstraint | undefined;
			if (!prism) return;

			prism.TargetPosition = position;
		});

		logic.events.updateMaxForce.invoked.Connect((player, { block, force }) => {
			if (!this.isValidBlock(block, player)) return;

			const bottomPart = block.FindFirstChild("Bottom") as Part | undefined;
			if (!bottomPart) return;

			const prism = bottomPart.FindFirstChild("PrismaticConstraint") as PrismaticConstraint | undefined;
			if (!prism) return;

			prism.ServoMaxForce = force;
		});
	}
}
