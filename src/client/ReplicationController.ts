import { RunService } from "@rbxts/services";
import { VectorUtils } from "shared/utils/VectorUtils";

export namespace ReplicationController {
	const parts = new Map<BasePart, CFrame>();
	const replicateStack: BasePart[] = [];
	const MIN_MAGNITUDE = 0.1;

	export function replicateBlock(part: BasePart) {
		parts.set(part, part.CFrame);
	}

	export function initialize() {
		RunService.Heartbeat.Connect((dT) => {
			for (const data of parts) {
				const part = data[0];
				const lastCFrame = data[1];
				parts.set(part, part.CFrame);

				// Don't replicate part if it is anchored
				if (part.Anchored) continue;

				// Don't replicate part if cframe is not changed
				if (VectorUtils.areCFrameEqual(lastCFrame, part.CFrame)) continue;

				replicateStack.push(part);
			}

			replicateChanges();
		});
	}

	function replicateChanges() {
		// TODO:
		// if (Players.LocalPlayer.Name === "3QAXM") {
		// 	print(replicateStack);
		// }

		replicateStack.clear();
	}
}
