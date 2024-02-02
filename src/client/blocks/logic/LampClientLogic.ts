import LampBlockLogic from "shared/block/logic/operations/output/LampBlockLogic";
import ClientBlockLogic from "../ClientBlockLogic";

export default class LampClientLogic extends ClientBlockLogic<typeof LampBlockLogic> {
	constructor(logic: typeof LampBlockLogic) {
		super(logic);

		logic.clientEvents.update.invoked.Connect(({ block, state, color }) => {
			if (!this.isValidBlock(block)) return;

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
