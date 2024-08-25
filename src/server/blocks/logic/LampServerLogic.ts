import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { LampBlockLogic } from "shared/block/logic/logic/display/LampBlockLogic";

@injectable
export class LampServerLogic extends ServerBlockLogic<typeof LampBlockLogic> {
	constructor(logic: typeof LampBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, { block, state, color, brightness, range }) => {
			if (!this.isValidBlock(block, player)) return;

			const part = block.PrimaryPart;
			const light = part?.WaitForChild("PointLight") as PointLight;
			if (!part) return;
			if (!light) return;

			if (state) {
				const commonColor = color ?? Color3.fromRGB(255, 255, 255);
				light.Range = range;
				part.Color = commonColor;
				light.Color = commonColor;
				part.Material = Enum.Material.Neon;
				light.Brightness = brightness;
				return;
			}
			part.Color = Color3.fromRGB(0, 0, 0);
			part.Material = Enum.Material.SmoothPlastic;
			light.Brightness = 0;
		});
	}
}
