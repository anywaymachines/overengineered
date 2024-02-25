import { Players, RunService } from "@rbxts/services";
import Control from "client/gui/Control";

export default class BlockPreviewControl extends Control<ViewportFrame> {
	private block?: BlockModel;

	constructor(gui: ViewportFrame, block?: BlockModel) {
		super(gui);
		this.set(block);

		const gcmode = Players.LocalPlayer.Name === "i3ymm";
		if (!gcmode) {
			this.event.subscribe(RunService.Heartbeat, (dt) => {
				if (this.block)
					this.block.PivotTo(
						this.block.GetPivot().mul(CFrame.fromEulerAnglesXYZ((math.pi / 3) * dt, (math.pi / 2) * dt, 0)),
					);
			});
		} else {
			let time = 0;

			this.event.subscribe(RunService.Heartbeat, (dt) => {
				if (!this.block) return;
				time += dt;

				const size = this.block.GetExtentsSize();
				const origin = new CFrame(new Vector3(0, 0.2, -0.5 - math.max(size.X, size.Y, size.Z)));

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

	set(block: BlockModel | undefined) {
		this.gui.ClearAllChildren();

		if (block) {
			this.block = block.Clone();
			this.block.Parent = this.gui;

			const size = this.block.GetExtentsSize();
			this.block.PivotTo(new CFrame(new Vector3(0, 0.2, -2 - math.max(size.X, size.Y, size.Z))));
		}
	}
}
