import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { PistonLogic } from "shared/block/logic/PistonBlockLogic";

@injectable
export class PistonBlockServerLogic extends ServerBlockLogic<typeof PistonLogic> {
	constructor(logic: typeof PistonLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

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
