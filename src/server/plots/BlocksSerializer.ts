import { HttpService } from "@rbxts/services";
import { ServerBuilding } from "server/building/ServerBuilding";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Logger } from "shared/Logger";
import { Serializer } from "shared/Serializer";
import { LogicRegistry } from "shared/block/LogicRegistry";
import { BlockConfigRegistry, blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { BlockManager, PlacedBlockDataConnection } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { Objects } from "shared/fixes/objects";

const logger = new Logger("BlocksSerializer");

type SerializedBlocks<TBlocks extends SerializedBlockBase> = {
	readonly version: number;
	readonly blocks: readonly TBlocks[];
};

interface SerializedBlockBase {
	readonly id: string;
}
interface SerializedBlockV0 extends SerializedBlockBase {
	readonly id: (keyof BlockConfigRegistry | keyof LogicRegistry) & string;
	readonly mat: SerializedEnum;
	readonly col: SerializedColor;
	readonly loc: SerializedCFrame;
	readonly config: Readonly<Record<string, defined>> | undefined;
}
interface SerializedBlockV2 extends SerializedBlockV0 {
	readonly uuid: BlockUuid;
}
interface SerializedBlockV3 extends SerializedBlockV2 {
	readonly connections?: Readonly<Record<BlockConnectionName, PlacedBlockDataConnection>>;
}

const read = {
	blocksFromPlot: <T extends SerializedBlockBase>(
		plot: PlotModel,
		serialize: (block: BlockModel, index: number, buildingCenter: CFrame) => T,
	): readonly T[] => {
		const buildingCenter = plot.BuildingArea.CFrame;
		return SharedPlots.getPlotComponent(plot)
			.getBlocks()
			.map((block, i) => serialize(block, i, buildingCenter));
	},

	blockV3: (block: BlockModel, index: number, buildingCenter: CFrame): SerializedBlockV3 => {
		return {
			id: BlockManager.manager.id.get(block) as SerializedBlockV3["id"],
			loc: Serializer.CFrameSerializer.serialize(buildingCenter.ToObjectSpace(block.GetPivot())),
			col: Serializer.Color3Serializer.serialize(BlockManager.manager.color.get(block)),
			mat: Serializer.EnumMaterialSerializer.serialize(BlockManager.manager.material.get(block)),
			uuid: BlockManager.manager.uuid.get(block),
			connections: BlockManager.manager.connections.get(block),
			config: BlockManager.manager.config.get(block),
		};
	},
} as const;
const place = {
	blocksOnPlot: <T extends SerializedBlockBase>(
		plot: PlotModel,
		data: readonly T[],
		place: (plot: PlotModel, blockData: T, buildingCenter: CFrame) => void,
	) => {
		const buildingCenter = plot.BuildingArea.CFrame;
		data.forEach((blockData) => place(plot, blockData, buildingCenter));
	},

	blockOnPlotV3: (plot: PlotModel, blockData: SerializedBlockV3, buildingCenter: CFrame) => {
		if (!BlocksInitializer.blocks.map.has(blockData.id)) {
			logger.error(`Could not load ${blockData.id} from slot: Block does not exists`);
			return;
		}

		const deserializedData: PlaceBlockRequest = {
			id: blockData.id,
			color: Serializer.Color3Serializer.deserialize(blockData.col ?? "FFFFFF"),
			material: Serializer.EnumMaterialSerializer.deserialize(blockData.mat ?? Enum.Material.Plastic.Value),
			location: buildingCenter.ToWorldSpace(Serializer.CFrameSerializer.deserialize(blockData.loc)),
			config: blockData.config as never,
			uuid: blockData.uuid,
		};

		const response = ServerBuilding.placeBlock(plot, deserializedData);
		if (response.success && response.model && blockData.connections) {
			BlockManager.manager.connections.set(response.model, blockData.connections);
		}
	},
} as const;

interface BlockSerializer<TBlocks extends SerializedBlocks<SerializedBlockBase>> {
	readonly version: number;
}
interface UpgradableBlocksSerializer<
	TBlocks extends SerializedBlocks<SerializedBlockBase>,
	TPrev extends BlockSerializer<SerializedBlocks<SerializedBlockBase>>,
> extends BlockSerializer<TBlocks> {
	upgradeFrom(data: string, prev: TPrev extends BlockSerializer<infer T> ? T : never): TBlocks;
}
interface CurrentUpgradableBlocksSerializer<
	TBlocks extends SerializedBlocks<SerializedBlockBase>,
	TPrev extends BlockSerializer<SerializedBlocks<SerializedBlockBase>>,
> extends UpgradableBlocksSerializer<TBlocks, TPrev> {
	read(plot: PlotModel): TBlocks;
	place(data: TBlocks, plot: PlotModel): number;
}

//

const v4: BlockSerializer<SerializedBlocks<SerializedBlockV0>> = {
	version: 4,
};

// added uuid
const v5: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV2>, typeof v4> = {
	version: 5,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV0>): SerializedBlocks<SerializedBlockV2> {
		return {
			version: this.version,
			blocks: prev.blocks.map(
				(b, i): SerializedBlockV2 => ({
					...b,
					uuid: tostring(i) as BlockUuid,
				}),
			),
		};
	},
};

// added logic connecitons
const v6: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v5> = {
	version: 6,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV2>): SerializedBlocks<SerializedBlockV3> {
		return {
			version: this.version,
			blocks: prev.blocks.map(
				(b, i): SerializedBlockV3 => ({
					...b,
					connections: {},
				}),
			),
		};
	},
};

// changed serialization to actual JSON
const v7: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v6> = {
	version: 7,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		return {
			version: this.version,
			blocks: prev.blocks.map(
				(b): SerializedBlockV3 => ({
					...b,
					config:
						b.config === undefined
							? undefined
							: Objects.fromEntries(
									Objects.entriesArray(b.config).map(
										(e) => [e[0], e[1] === "Y" ? true : e[1] === "N" ? false : e[1]] as const,
									),
								),
				}),
			),
		};
	},
};

// updated block config layout
const v8: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v7> = {
	version: 8,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		type reg = typeof blockConfigRegistry;
		type partial<T extends object> = {
			readonly [k in keyof T]?: T[k] extends object ? partial<T[k]> : T[k];
		};

		const update = (block: SerializedBlockV3) => {
			if (block.id === "servomotorblock") {
				type config = partial<{
					readonly [k in keyof reg["servomotorblock"]["input"]]: reg["servomotorblock"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							speed?: number;
							rotate_add?: KeyCode;
							rotate_sub?: KeyCode;
							switch?: boolean;
							angle?: number;
					  }
					| undefined;

				const config: object = {
					speed: cfg?.speed,
					angle: {
						rotate_add: cfg?.rotate_add,
						rotate_sub: cfg?.rotate_sub,
						switchmode: cfg?.switch,
						angle: cfg?.angle,
					},
				};

				return config;
			}
			if (block.id === "smallrocketengine" || block.id === "rocketengine") {
				type config = partial<{
					readonly [k in keyof reg["rocketengine"]["input"]]: reg["rocketengine"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							thrust_add?: KeyCode;
							thrust_sub?: KeyCode;
							switchmode?: boolean;
							strength?: number;
					  }
					| undefined;

				const config: config = {
					thrust: {
						thrust: {
							add: cfg?.thrust_add ?? "W",
							sub: cfg?.thrust_sub ?? "S",
						},
						switchmode: cfg?.switchmode,
					},
				};

				return config;
			}
			if (block.id === "motorblock") {
				type config = partial<{
					readonly [k in keyof reg["motorblock"]["input"]]: reg["motorblock"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							speed?: number;
							rotate_add?: KeyCode;
							rotate_sub?: KeyCode;
							switch?: boolean;
					  }
					| undefined;

				const config: object = {
					rotationSpeed: {
						rotate_add: cfg?.rotate_add,
						rotate_sub: cfg?.rotate_sub,
						switchmode: cfg?.switch,
						speed: cfg?.speed,
					},
				};

				return config;
			}
			if (block.id === "disconnectblock") {
				type config = partial<{
					readonly [k in keyof reg["disconnectblock"]["input"]]: reg["disconnectblock"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							disconnect?: KeyCode;
					  }
					| undefined;

				const config: config = {
					disconnect: {
						key: cfg?.disconnect,
					},
				};

				return config;
			}
			if (block.id === "tnt") {
				type config = partial<{
					readonly [k in keyof reg["tnt"]["input"]]: reg["tnt"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							explode?: KeyCode;
							radius?: number;
							pressure?: number;
							flammable?: boolean;
							impact?: boolean;
					  }
					| undefined;

				const config: config = {
					explode: {
						key: cfg?.explode,
					},
					flammable: cfg?.flammable,
					radius: cfg?.radius,
					impact: cfg?.impact,
					pressure: cfg?.pressure,
				};

				return config;
			}

			return block.config;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(
				(b): SerializedBlockV3 => ({
					...b,
					config: update(b) as never,
				}),
			),
		};
	},
};

// updated block config layout
const v9: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v8> = {
	version: 9,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		type reg = typeof blockConfigRegistry;
		type partial<T extends object> = {
			readonly [k in keyof T]?: T[k] extends object ? partial<T[k]> : T[k];
		};

		const update = (block: SerializedBlockV3) => {
			if (block.id === "motorblock") {
				type config = partial<{
					readonly [k in keyof reg["motorblock"]["input"]]: reg["motorblock"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							rotationSpeed: {
								rotate_add?: KeyCode;
								rotate_sub?: KeyCode;
								switchmode?: boolean;
								speed?: number;
							};
					  }
					| undefined;

				const config: config = {
					rotationSpeed: {
						rotation: {
							add: cfg?.rotationSpeed.rotate_add,
							sub: cfg?.rotationSpeed.rotate_sub,
						},
						switchmode: cfg?.rotationSpeed.switchmode,
						speed: cfg?.rotationSpeed.speed,
					},
				};

				return config;
			}
			if (block.id === "servomotorblock") {
				type config = partial<{
					readonly [k in keyof reg["servomotorblock"]["input"]]: reg["servomotorblock"]["input"][k]["config"];
				}>;

				const cfg = block.config as
					| {
							speed: number;
							angle: {
								speed?: number;
								rotate_add?: KeyCode;
								rotate_sub?: KeyCode;
								switchmode?: boolean;
								angle?: number;
							};
					  }
					| undefined;

				const config: config = {
					speed: cfg?.speed,
					angle: {
						rotation: {
							add: cfg?.angle.rotate_add,
							sub: cfg?.angle.rotate_sub,
						},
						switchmode: cfg?.angle.switchmode,
						angle: cfg?.angle.angle,
					},
				};

				return config;
			}

			return block.config;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(
				(b): SerializedBlockV3 => ({
					...b,
					config: update(b),
				}),
			),
		};
	},
};

// fix blocks not aligned with the grid (disabled due to v11 doing the same again)
const v10: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v9> = {
	version: 10,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		return prev;
	},
};

// fix blocks not aligned with the grid
const v11: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v10> = {
	version: 11,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			const cf = Serializer.CFrameSerializer.deserialize(block.loc);
			const pos = cf.Position;
			const fixedpos = new Vector3(
				math.round(pos.X * 2) / 2,
				math.round(pos.Y * 2) / 2,
				math.round(pos.Z * 2) / 2,
			);
			const newcf = cf.Rotation.add(fixedpos);

			return {
				...block,
				loc: Serializer.CFrameSerializer.serialize(newcf),
			};
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// rename ultrasonic to lidar
const v12: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v11> = {
	version: 12,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			if ((block.id as string) === "ultrasonicsensor") {
				return {
					...block,
					id: "lidarsensor",
				};
			}

			return block;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// rotate roundwedgeout to 0, -90, 0
const v13: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v12> = {
	version: 13,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			if ((block.id as string) === "roundwedgeout") {
				return {
					...block,
					id: "convexprism" as never,
					loc: Serializer.CFrameSerializer.serialize(
						Serializer.CFrameSerializer.deserialize(block.loc).mul(
							CFrame.fromEulerAnglesXYZ(0, math.rad(-90), 0),
						),
					),
				};
			}
			if ((block.id as string) === "roundwedgein") {
				return {
					...block,
					id: "concaveprism" as never,
					loc: Serializer.CFrameSerializer.serialize(
						Serializer.CFrameSerializer.deserialize(block.loc).mul(
							CFrame.fromEulerAnglesXYZ(0, math.rad(-90), 0),
						),
					),
				};
			}

			return block;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// rotate innercorner -> innerwedge, rotate
const v14: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v13> = {
	version: 14,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			if ((block.id as string) === "innerwedge") {
				return {
					...block,
					id: "innercorner" as never,
				};
			}

			return block;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// update constant from number to or
const v15: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v14> = {
	version: 15,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			if (block.id === "constant") {
				return {
					...block,
					config: Objects.fromEntries(
						Objects.entriesArray(block.config ?? {}).map(([k, v]) => [
							k,
							{ type: "number", value: v ?? 0 },
						]),
					),
				};
			}

			return block;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// update ADD SUB DIV MIL from number to number | vector3
const v16: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v15> = {
	version: 16,
	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		const update = (block: SerializedBlockV3): SerializedBlockV3 => {
			if (
				block.id === "operationadd" ||
				block.id === "operationsub" ||
				block.id === "operationmul" ||
				block.id === "operationdiv"
			) {
				return {
					...block,
					config: Objects.fromEntries(
						Objects.entriesArray(block.config ?? {}).map(([k, v]) => [
							k,
							{ type: "number", value: v ?? 0 },
						]),
					),
				};
			}

			return block;
		};

		return {
			version: this.version,
			blocks: prev.blocks.map(update),
		};
	},
};

// update de/serialization of color & material
// REMOVED; caused the loss of block material and color
const v17: UpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v16> = {
	version: 17,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		return {
			version: this.version,
			blocks: prev.blocks as never,
		};
	},
};

// fix de/serialization of color & material from v17
const v18: CurrentUpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v17> = {
	version: 18,

	upgradeFrom(data: string, prev: SerializedBlocks<SerializedBlockV3>): SerializedBlocks<SerializedBlockV3> {
		return {
			version: this.version,
			blocks: prev.blocks,
		};
	},

	read(plot: PlotModel): SerializedBlocks<SerializedBlockV3> {
		return {
			version: this.version,
			blocks: read.blocksFromPlot(plot, read.blockV3),
		};
	},
	place(data: SerializedBlocks<SerializedBlockV3>, plot: PlotModel): number {
		place.blocksOnPlot(plot, data.blocks, place.blockOnPlotV3);
		return data.blocks.size();
	},
};

//

const versions = [v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18] as const;
const current = versions[versions.size() - 1] as typeof versions extends readonly [...unknown[], infer T] ? T : never;

const getVersion = (version: number) => versions.find((v) => v.version === version);

/** Methods to save and load buildings */
export namespace BlocksSerializer {
	export function serialize(plot: PlotModel): string {
		return HttpService.JSONEncode(current.read(plot));
	}
	export function deserialize(data: string, plot: PlotModel): number {
		let deserialized = HttpService.JSONDecode(data) as SerializedBlocks<SerializedBlockBase>;
		logger.info(`Loaded a slot using savev${deserialized.version}`);

		const version = deserialized.version;
		for (let i = version + 1; i <= current.version; i++) {
			const version = getVersion(i);
			if (!version) continue;
			if (!("upgradeFrom" in version)) continue;

			deserialized = version.upgradeFrom(data, deserialized as never);
			logger.info(`Upgrading a slot to savev${version.version}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		current.place(deserialized as any, plot);
		return deserialized.blocks.size();
	}
}
