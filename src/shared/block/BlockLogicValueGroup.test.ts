import { Players, RunService } from "@rbxts/services";
import { Assert } from "shared/Assert";
import { BlockLogicValueGroup, _Internal } from "shared/block/BlockLogicValueGroup";

type BL = {
	readonly holderId: string;
	connections: readonly BL[];
};

export namespace _Tests {
	export namespace BlockLogicValueGroupTests {
		export namespace Grouping {
			export function grouping1to1() {
				const l1: BL = {
					holderId: "1",
					connections: [],
				};
				l1.connections = [l1];

				const grouping = BlockLogicValueGroup.group([l1]);

				Assert.equals(grouping.size(), 1);
				Assert.equals(grouping[0].size(), 1);
				Assert.equals(grouping[0][0].id, l1.holderId);
			}
			export function grouping1to2() {
				const l1: BL = {
					holderId: "1",
					connections: [],
				};
				const l2: BL = {
					holderId: "2",
					connections: [],
				};
				l1.connections = [l2];

				const grouping = BlockLogicValueGroup.group([l1, l2]);
				print("grouping", grouping);

				Assert.equals(grouping.size(), 2);
				Assert.equals(grouping[0].size(), 1);
				Assert.equals(grouping[1].size(), 1);
				Assert.equals(grouping[0][0].id, l1.holderId);
				Assert.equals(grouping[1][0].id, l2.holderId);
			}
			export function grouping1toOther1() {
				const l1: BL = {
					holderId: "1",
					connections: [],
				};
				const l2: BL = {
					holderId: "1",
					connections: [],
				};
				l1.connections = [l2];

				const grouping = BlockLogicValueGroup.group([l1, l2]);

				Assert.equals(grouping.size(), 1);
				Assert.equals(grouping[0].size(), 1);
				Assert.equals(grouping[0][0].id, l1.holderId);
			}
			export function grouping1to2to3() {
				const l1: BL = {
					holderId: "1",
					connections: [],
				};
				const l2: BL = {
					holderId: "2",
					connections: [],
				};
				l1.connections = [l2];
				l2.connections = [l1];

				const grouping = BlockLogicValueGroup.group([l1, l2]);

				Assert.equals(grouping.size(), 2);
				Assert.equals(grouping[0].size(), 1);
				Assert.equals(grouping[1].size(), 1);
				Assert.equals(grouping[0][0].id, l1.holderId);
				Assert.equals(grouping[1][0].id, l2.holderId);
			}
			export function grouping1to2to3with2to4() {
				const l1: BL = {
					holderId: "1",
					connections: [],
				};
				const l2: BL = {
					holderId: "2",
					connections: [],
				};
				const l3: BL = {
					holderId: "3",
					connections: [],
				};
				l1.connections = [l2];
				l2.connections = [l1, l3];

				const grouping = BlockLogicValueGroup.group([l1, l2, l3]);

				//Assert.equals(grouping.size(), 2);
				Assert.equals(grouping.size(), 3);
				Assert.equals(grouping[0].size(), 1);
				//Assert.equals(grouping[1].size(), 2);
				Assert.equals(grouping[1].size(), 1);
				Assert.equals(grouping[2].size(), 1);
				Assert.equals(grouping[0][0].id, l1.holderId);
				Assert.equals(grouping[1][0].id, l2.holderId);
				//Assert.equals(grouping[1][1].id, l3.holderId);
				Assert.equals(grouping[2][0].id, l3.holderId);
			}
		}

		export function filterActualCircular() {
			if (RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm") {
				type t = { id: string; children: readonly t[] };

				const b1: t = { id: "1", children: [] };
				const b2: t = { id: "2", children: [] };
				const b3: t = { id: "3", children: [] };
				const b4: t = { id: "4", children: [] };
				b1.children = [b2];
				b2.children = [b1, b3];
				b3.children = [b4];

				const parented = new Set([b1, b2, b3, b4]);
				const circle = _Internal.filterActualCircular(parented);

				Assert.setEquals(circle, new Set([b1, b2]));
			}
		}
	}
}
