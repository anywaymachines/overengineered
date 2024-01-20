import { RunService } from "@rbxts/services";
import Control from "client/base/Control";

export default class BlockPreviewControl extends Control<ViewportFrame> {
	private readonly block: BlockModel;

	constructor(gui: ViewportFrame, block: Block) {
		super(gui);

		this.gui.ClearAllChildren();

		this.block = block.model.Clone();
		this.block.Parent = this.gui;

		const size = this.block.GetExtentsSize();
		this.block.PivotTo(new CFrame(new Vector3(0, 0.2, -2 - math.max(size.X, size.Y, size.Z))));

		this.event.subscribe(RunService.Heartbeat, () => {
			this.block.PivotTo(
				this.block.GetPivot().mul(CFrame.fromEulerAnglesXYZ(math.pi / 180 / 3, math.pi / 180 / 2, 0)),
			);
		});
	}
}
