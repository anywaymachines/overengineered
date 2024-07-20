import type { TutorialDiffList } from "client/tutorial/TutorialController";

export const TestTutorialDiff = {
	saveVersion: 23,
	diffs: {
		d0buildFrame: [
			{ block: { uuid: "bdel", location: new CFrame(29, 1.5, 11), id: "block" }, type: "added" },
			{ block: { uuid: "b9", location: new CFrame(29, 3.5, 11), id: "block" }, type: "added" },
			{ block: { uuid: "b5", location: new CFrame(35, 1.5, 11), id: "block" }, type: "added" },
			{ block: { uuid: "b4", location: new CFrame(31, 1.5, 9), id: "block" }, type: "added" },
			{ block: { uuid: "b7", location: new CFrame(29, 3.5, 9), id: "block" }, type: "added" },
			{ block: { uuid: "b6", location: new CFrame(35, 1.5, 7), id: "block" }, type: "added" },
			{ block: { uuid: "b8", location: new CFrame(29, 3.5, 7), id: "block" }, type: "added" },
			{ block: { uuid: "b1", location: new CFrame(33, 1.5, 9), id: "block" }, type: "added" },
			{ block: { uuid: "b2", location: new CFrame(35, 1.5, 9), id: "block" }, type: "added" },
			{ block: { uuid: "b3", location: new CFrame(29, 1.5, 9), id: "block" }, type: "added" },
		],
		d1deleteBlock: [{ uuid: "bdel", type: "removed" }],
		d2placeServos: [
			{
				block: {
					uuid: "s1",
					location: new CFrame(29, 3.5, 13, 1, 0, 0, 0, -1, 0, 0, 0, -1),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				block: {
					uuid: "s2",
					location: new CFrame(29, 3.5, 5, 1, 0, 0, 0, -1, 0, 0, 0, -1),
					id: "servomotorblock",
				},
				type: "added",
			},
			{ block: { uuid: "bb1", location: new CFrame(29, 1.5, 5), id: "block" }, type: "added" },
			{ block: { uuid: "bb2", location: new CFrame(29, 1.5, 13), id: "block" }, type: "added" },
		],
		d3placeSeat: [
			{
				block: {
					uuid: "seat",
					location: new CFrame(34, 4.5, 9, 0, 0, 1, 0, 1, 0, -1, 0, 0),
					id: "vehicleseat",
				},
				type: "added",
			},
		],
		d4prtest: [
			{ uuid: "b8", type: "removed" },
			{ block: { uuid: "bbb1", location: new CFrame(29, 5.5, 10), id: "block" }, type: "added" },
		],
		d5cfgtest: [{ uuid: "s1", key: "angle", value: { rotation: { add: "W", sub: "S" } }, type: "configChanged" }],
	},
} satisfies TutorialDiffList;
