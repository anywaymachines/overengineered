import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { LEDDisplayBlockLogic } from "shared/block/logic/operations/output/LEDDisplayBlockLogic";

export class LEDDisplayServerLogic extends ServerBlockLogic<typeof LEDDisplayBlockLogic> {
	constructor(logic: typeof LEDDisplayBlockLogic) {
		super(logic);

		// const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui")
		// for (let x = 0; x < 8; x++) {
		// 	for (let y = 0; y < 8; y++) {
		// 		const frame = new Instance("Frame");
		// 		frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0);
		// 		frame.Parent = gui;
		// 		frame.Name = `x${x}y${y}`
		// 	}
		// }

		logic.events.prepare.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;

			const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui") as SurfaceGui;
			for (let x = 0; x < 8; x++) {
				for (let y = 0; y < 8; y++) {
					const frame = new Instance("Frame");
					frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0);
					frame.Parent = gui;
					frame.Name = `x${x}y${y}`;
					frame.LayoutOrder = x + y * 8;
					// task.wait();
				}
			}

			gui.Enabled = true;
		});

		logic.events.update.invoked.Connect((player, { block, color, frame }) => {
			if (!this.isValidBlock(block, player)) return;
			const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui");
			if (!frame.IsDescendantOf(gui)) return player?.Kick("ban forev");

			frame.BackgroundColor3 = color;
		});
	}
}
