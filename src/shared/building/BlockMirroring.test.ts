import { RunService, Workspace } from "@rbxts/services";
import { BuildingManager } from "shared/building/BuildingManager";
import { EventHandler } from "shared/event/EventHandler";
import type { BlockRegistry } from "shared/block/BlockRegistry";

const parent = new Instance("Folder", Workspace);
parent.Name = "BlockMirroringTest";

const spawn = (di: DIContainer, blockid: BlockId, pos: CFrame) => {
	const block = di.resolve<BlockRegistry>().blocks.get(blockid)!.model.Clone();
	block.Parent = parent;
	block.PivotTo(pos);

	return block;
};
const mirror = (di: DIContainer, blockid: BlockId, initialRotation?: CFrame) => {
	const main = spawn(di, blockid, (initialRotation ?? CFrame.identity).add(new Vector3(394, -16379, 357)));

	const mirrored = BuildingManager.getMirroredBlocks(
		new CFrame(396, -16377, 359),
		{ id: blockid, pos: main.GetPivot() },
		{ x: 0, y: 0, z: 0 },
		di.resolve<BlockRegistry>(),
	);

	for (const { id, pos } of mirrored) {
		spawn(di, id, pos);
	}
};

const eventHandler = new EventHandler();
export namespace _Tests {
	const id: BlockId = "halfcornerwedge2x1";

	export namespace BlockMirroring {
		export function cleanup() {
			eventHandler.unsubscribeAll();
			_cleanup();
		}

		export function wingRotated(di: DIContainer) {
			let time = 0;

			eventHandler.register(
				RunService.Heartbeat.Connect((dt) => {
					time += dt;
					_cleanup();

					const rotation = CFrame.fromEulerAnglesXYZ((math.pi / 3) * time, (math.pi / 2) * time, 0);
					mirror(di, id, rotation);
				}),
			);
		}
		export function object(di: DIContainer) {
			cleanup();
			mirror(di, id);
		}

		function _cleanup() {
			parent.ClearAllChildren();
		}
	}
}
