import { Players, RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

interface RadarChunks {
	radarChunk: Part;
	c: number;
	isDetected: boolean;
	detectedCords: Vector3;
	isAvalaible: boolean;
}

const ownDetectablesSet = new Set<BasePart>();

if (RunService.IsClient()) {
	const p = Players.LocalPlayer;
	CustomRemotes.modes.set.sent.Connect(({ mode }) => {
		if (mode === "ride") {
			const blocks = SharedPlots.instance.getPlotComponentByOwnerID(p.UserId).getBlocks();

			for (const b of blocks) {
				if (!b.PrimaryPart) continue;
				ownDetectablesSet.add(b.PrimaryPart);
			}
			return;
		}

		ownDetectablesSet.clear();
	});
}

const definition = {
	inputOrder: [
		"start",
		"end",
		"chunkSpawnRate",
		"chunkEndSize",
		"visibility",
		"detectSelf",
		"radarChunksCap",
		"detectQueryCap",
	],
	input: {
		start: {
			displayName: "Start",
			types: {
				number: {
					config: 60,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 131072,
					},
				},
			},
		},
		end: {
			displayName: "End",
			types: {
				number: {
					config: 4096,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 131072,
					},
				},
			},
		},
		chunkSpawnRate: {
			displayName: "chunkSpawnRate",
			types: {
				number: {
					config: 60,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 16384,
					},
				},
			},
		},
		chunkEndSize: {
			displayName: "endSize",
			types: {
				number: {
					config: 2048,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 2048,
					},
				},
			},
			connectorHidden: true,
		},
		visibility: {
			displayName: "Detection Area Visibility",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
		detectSelf: {
			displayName: "Detect Self",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
		radarChunksCap: {
			displayName: "Radar Chunks Capacity",
			types: {
				number: {
					config: 32,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 16384,
					},
				},
			},
			connectorHidden: true,
		},
		detectQueryCap: {
			displayName: "Detect Query Capacity",
			types: {
				number: {
					config: 4,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 64,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		gps: {
			displayName: "Offset",
			types: ["vector3"],
		},
		isDetected: {
			displayName: "Is Detected",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as DistantRadarSectionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const offset = new Vector3(0, -GameDefinitions.HEIGHT_OFFSET, 0);

		let inputValues = {
			start: 0,
			end: 0,
			chunkSpawnRate: 0,
			chunkEndSize: 0,
			visibility: false,
			detectSelf: false,
			radarChunksCap: 0,
			detectQueryCap: 0,
		};
		this.on((data) => (inputValues = data));
		this.output.gps.set("vector3", new Vector3(0, 0, 0));

		const metalBase = this.instance.FindFirstChild("MetalBase") as BasePart;

		const mainRadarChunk = this.instance.FindFirstChild("RadarChunk") as Part;
		mainRadarChunk.Anchored = true;
		const radarChunksList: RadarChunks[] = [];

		let tickCounter = 0;
		let isFirstTick = true;
		// Since the radar can detect several targets in one tick, we will store them in a queue and output the result every logical tick
		const detectQueryCap: Vector3[] = [];
		this.onTicc(() => {
			if (isFirstTick) {
				// init
				for (let i = 0; i < inputValues.radarChunksCap; i++) {
					const cloneRadarChunk = mainRadarChunk.Clone();
					cloneRadarChunk.Anchored = true;
					cloneRadarChunk.Parent = metalBase;

					const item: RadarChunks = {
						radarChunk: cloneRadarChunk,
						c: 0,
						isDetected: false,
						detectedCords: new Vector3(0, 0, 0),
						isAvalaible: true,
					};
					item.radarChunk.Position = offset;

					if (inputValues.visibility) {
						item.radarChunk.Transparency = 0.8;
					} else {
						item.radarChunk.Transparency = 1;
					}

					cloneRadarChunk.Touched.Connect((otherPart) => {
						if (item.isAvalaible || item.isDetected) {
							return;
						}

						if (otherPart.HasTag(TagUtils.allTags.SPECIAL_RADARVIEW)) return; // ignore special tags
						if (!inputValues.detectSelf && ownDetectablesSet.has(otherPart)) return; // ignore own blocks if this option is set

						// save data
						item.isDetected = true;
						item.detectedCords = otherPart.Position;
					});

					radarChunksList.push(item);
				}

				isFirstTick = false;
			}

			if (tickCounter >= inputValues.chunkSpawnRate) {
				// find and mark new chunk
				for (let i = 0; i < inputValues.radarChunksCap; i++) {
					if (radarChunksList[i].isAvalaible) {
						radarChunksList[i].radarChunk.CFrame = metalBase.CFrame;
						radarChunksList[i].radarChunk.Position = metalBase.Position;
						radarChunksList[i].radarChunk.CFrame.mul(new CFrame(inputValues.start, 0, 0));
						radarChunksList[i].c = 0;
						radarChunksList[i].isAvalaible = false;
						radarChunksList[i].isDetected = false;

						break;
					}
				}

				tickCounter = 1; // drop tick counter when chunk was selected
			}

			if (detectQueryCap.size() > 0) {
				this.output.gps.set("vector3", detectQueryCap[0].add(offset));
				detectQueryCap.remove(0);
				this.output.isDetected.set("bool", true);
			} else {
				this.output.isDetected.set("bool", false);
			}

			tickCounter++;
		});

		this.event.subscribe<[number]>(RunService.Heartbeat as ReadonlyArgsSignal<[number]>, (dt) => {
			// we run through the created chunks to move them forward
			for (let i = 0; i < inputValues.radarChunksCap; i++) {
				if (!radarChunksList[i].isAvalaible) {
					let isDrop = false;

					// void checking
					if (radarChunksList[i].radarChunk.Position.Y < -offset.Y) {
						isDrop = true;
					}

					// border checking
					if (radarChunksList[i].c * 100 > inputValues.end) {
						isDrop = true;
					}

					// detection checking
					if (radarChunksList[i].isDetected) {
						if (detectQueryCap.size() < inputValues.detectQueryCap) {
							detectQueryCap.push(radarChunksList[i].detectedCords);
						}

						isDrop = true;
					}

					if (isDrop) {
						radarChunksList[i].radarChunk.Position = offset;
						radarChunksList[i].c = 0;
						radarChunksList[i].isDetected = false;
						radarChunksList[i].detectedCords = new Vector3(0, 0, 0);
						radarChunksList[i].isAvalaible = true;
					} else {
						radarChunksList[i].radarChunk.CFrame = radarChunksList[i].radarChunk.CFrame.add(
							radarChunksList[i].radarChunk.CFrame.RightVector.mul(100),
						);

						const newSize = (inputValues.chunkEndSize * radarChunksList[i].c * 100) / inputValues.end;
						radarChunksList[i].radarChunk.Size = new Vector3(100, newSize, newSize);

						radarChunksList[i].c++;
					}
				}
			}
		});
	}
}

export const DistantRadarSectionBlock = {
	...BlockCreation.defaults,
	id: "distantradar",
	displayName: "Distant Radar",
	description:
		"Will handle chunks that move away from the radar at a certain distance and disappear if an object is detected",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
