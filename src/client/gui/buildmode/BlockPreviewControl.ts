import { RunService } from "@rbxts/services";
import Control from "client/gui/Control";

export default class BlockPreviewControl extends Control<ViewportFrame> {
	private readonly block: BlockModel;

	constructor(gui: ViewportFrame, block: Block) {
		super(gui);

		this.gui.ClearAllChildren();

		this.block = block.model.Clone();
		this.block.Parent = this.gui;

		const size = this.block.GetExtentsSize();
		this.block.PivotTo(new CFrame(new Vector3(0, 0.2, -2 - math.max(size.X, size.Y, size.Z))));

		const gcmode = false;

		if (!gcmode) {
			this.event.subscribe(RunService.Heartbeat, (dt) => {
				this.block.PivotTo(
					this.block.GetPivot().mul(CFrame.fromEulerAnglesXYZ((math.pi / 3) * dt, (math.pi / 2) * dt, 0)),
				);
			});
		} else {
			const origin = new CFrame(new Vector3(0, 0.2, -0.5 - math.max(size.X, size.Y, size.Z)));
			let time = 0;

			this.event.subscribe(RunService.Heartbeat, (dt) => {
				time += dt;

				if (time < 1) {
					this.block.PivotTo(
						origin.add(new Vector3((time - 1) * 4, 0, 0)).mul(CFrame.fromOrientation(0, 60, 0)),
					);
				} else if (time < 2) {
					this.block.PivotTo(
						origin.add(new Vector3(0, (time - 2) * 4, 0)).mul(CFrame.fromOrientation(0, 0, 60)),
					);
				} else if (time < 3) {
					this.block.PivotTo(
						origin.add(new Vector3(-(time - 3) * 4, 0, 0)).mul(CFrame.fromOrientation(0, -60, 0)),
					);
				} else if (time < 4) {
					this.block.PivotTo(
						origin.add(new Vector3(0, -(time - 4) * 4, 0)).mul(CFrame.fromOrientation(0, 0, 0)),
					);
				} else time = 0;
			});
		}
	}
}
