import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { LampBlockLogic } from "shared/block/logic/logic/display/LampBlockLogic";

export class LampServerLogic extends ServerBlockLogic<typeof LampBlockLogic> {
	constructor(logic: typeof LampBlockLogic) {
		super(logic);

		logic.events.update.invoked.Connect((player, { block, state, color }) => {
			if (!this.isValidBlock(block, player)) return;

			const part = block.PrimaryPart;
			if (!part) return;

			if (state) {
				part.Color = color ?? Color3.fromRGB(255, 255, 255);
				part.Material = Enum.Material.Neon;
			} else {
				part.Color = Color3.fromRGB(0, 0, 0);
				part.Material = Enum.Material.SmoothPlastic;
			}
		});
	}
}
