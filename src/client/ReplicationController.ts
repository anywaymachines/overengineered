import { RunService } from "@rbxts/services";
import VectorUtils from "shared/utils/VectorUtils";

export default class ReplicationController {
	private static parts: Map<BasePart, CFrame> = new Map();
	private static replicateStack: BasePart[] = [];

	private static readonly MIN_MAGNITUDE = 0.1;

	static replicateBlock(part: BasePart) {
		this.parts.set(part, part.CFrame);
	}

	static initialize() {
		RunService.Heartbeat.Connect((dT) => {
			for (const data of this.parts) {
				const part = data[0];
				const lastCFrame = data[1];
				this.parts.set(part, part.CFrame);

				// Don't replicate part if it is anchored
				if (part.Anchored) continue;

				// Don't replicate part if cframe is not changed
				if (VectorUtils.areCFrameEqual(lastCFrame, part.CFrame)) continue;

				this.replicateStack.push(part);
			}

			this.replicateChanges();
		});
	}

	private static replicateChanges() {
		// TODO:
		// if (Players.LocalPlayer.Name === "3QAXM") {
		// 	print(this.replicateStack);
		// }

		this.replicateStack.clear();
	}
}
