import type { TutorialDiffList } from "client/tutorial/TutorialController";

export const BasicPlaneTutorialDiff = {
	saveVersion: 24,
	diffs: {
		d0: [
			{
				block: {
					uuid: "2ac95286-92d0-4909-b24b-58d3510ae8b7",
					location: new CFrame(8, 1.5, 2, -1, 0, 0, 0, 0, 1, 0, 1, 0),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				type: "configChanged",
				uuid: "2ac95286-92d0-4909-b24b-58d3510ae8b7",
				key: "angle",
				value: { rotation: { sub: "D", add: "A" } },
			},
			{
				block: {
					uuid: "e5e69915-da12-4693-a453-892fee1ec28f",
					location: new CFrame(0, 1.5, -2, 1, 0, 0, 0, 0, 1, 0, -1, 0),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				type: "configChanged",
				uuid: "e5e69915-da12-4693-a453-892fee1ec28f",
				key: "angle",
				value: { rotation: { sub: "W", add: "S" }, angle: 15 },
			},
			{
				block: { uuid: "b3356701-44e2-4dce-93e0-725ab7ec4252", location: new CFrame(8, 1.5, 0), id: "block" },
				type: "added",
			},
			{
				block: { uuid: "4e6a618f-9e54-4935-8833-3a0d5550e5d5", location: new CFrame(4, 1.5, 0), id: "block" },
				type: "added",
			},
			{
				block: { uuid: "4bbb7257-224d-46f2-b139-e34fdb386892", location: new CFrame(0, 1.5, 0), id: "block" },
				type: "added",
			},
			{
				block: {
					uuid: "f879de1e-fe09-41c0-bc06-c8303d612191",
					location: new CFrame(8, 1.5, -7, 0, 0, 1, 0, -1, 0, 1, 0, 0),
					id: "wedgewing1x4",
				},
				type: "added",
			},
			{
				block: {
					uuid: "cbbe56b1-9c6b-4914-9333-7bf6dc9e4501",
					location: new CFrame(11, 1.5, 0),
					id: "smallrocketengine",
				},
				type: "added",
			},
			{
				block: {
					uuid: "1167dbb7-ade4-4b41-bbcb-63d3d25bceb1",
					location: new CFrame(8, 1.5, -2, 1, 0, 0, 0, 0, 1, 0, -1, 0),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				block: {
					uuid: "cb3f633e-33bc-466d-a9c6-b9af2fcecacb",
					location: new CFrame(8, 3.5, 0),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				uuid: "cbbe56b1-9c6b-4914-9333-7bf6dc9e4501",
				key: "thrust",
				value: { thrust: { sub: "F", add: "R" } },
				type: "configChanged",
			},
			{
				uuid: "1167dbb7-ade4-4b41-bbcb-63d3d25bceb1",
				key: "angle",
				value: { rotation: { sub: "D", add: "A" } },
				type: "configChanged",
			},
			{
				uuid: "cb3f633e-33bc-466d-a9c6-b9af2fcecacb",
				key: "angle",
				value: { rotation: { sub: "A", add: "D" } },
				type: "configChanged",
			},
			{
				block: {
					uuid: "068f884e-d248-4dcc-994a-0f7c1b3c6adf",
					location: new CFrame(-2, 1.5, -1, 0, -1, -0, -1, 0, -0, 0, 0, -1),
					id: "cornerwedge1x1",
				},
				type: "added",
			},
			{
				block: {
					uuid: "183bf841-0cba-48ed-989a-0be39d6810d4",
					location: new CFrame(0, 1.5, -7, 0, 0, 1, 0, -1, 0, 1, 0, 0),
					id: "wedgewing1x4",
				},
				type: "added",
			},
			{
				block: { uuid: "edc6ce61-e702-423a-9d95-601466335513", location: new CFrame(6, 1.5, 0), id: "block" },
				type: "added",
			},
			{
				block: {
					uuid: "46edf074-a747-4586-9dcb-f71ce7e62c10",
					location: new CFrame(0, 4.5, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0),
					id: "vehicleseat",
				},
				type: "added",
			},
			{
				block: {
					uuid: "272ba2eb-43c2-4d6e-be23-68c0abe4bcd6",
					location: new CFrame(0, 1.5, 2, -1, 0, 0, 0, 0, 1, 0, 1, 0),
					id: "servomotorblock",
				},
				type: "added",
			},
			{
				uuid: "272ba2eb-43c2-4d6e-be23-68c0abe4bcd6",
				key: "angle",
				value: { rotation: { sub: "S", add: "W" }, angle: 15 },
				type: "configChanged",
			},
			{
				block: {
					uuid: "5567ca49-fd22-4ecc-8566-c628970dee05",
					location: new CFrame(8, 1.5, 7, 0, 0, 1, 0, 1, 0, -1, 0, 0),
					id: "wedgewing1x4",
				},
				type: "added",
			},
			{
				block: {
					uuid: "8893aa68-863e-40af-b6a0-c23ea321a6e6",
					location: new CFrame(-2, 1.5, 1, 0, -1, 0, 0, 0, 1, -1, 0, 0),
					id: "cornerwedge1x1",
				},
				type: "added",
			},
			{
				block: {
					uuid: "c08d314c-baaa-461c-b33b-2ff2c9098da5",
					location: new CFrame(8, 8.5, 0, 0, 0, 1, -1, 0, 0, 0, -1, 0),
					id: "wedgewing1x4",
				},
				type: "added",
			},
			{
				block: { uuid: "1d2a2ded-337a-4b28-af22-5e47053f6e72", location: new CFrame(2, 1.5, 0), id: "block" },
				type: "added",
			},
			{
				block: {
					uuid: "30f9dba7-319f-4480-bd73-dafab47b73ac",
					location: new CFrame(0, 1.5, 7, 0, 0, 1, 0, 1, 0, -1, 0, 0),
					id: "wedgewing1x4",
				},
				type: "added",
			},
		],
	},
} satisfies TutorialDiffList;
