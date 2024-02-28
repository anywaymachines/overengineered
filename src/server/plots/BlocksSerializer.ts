import { HttpService } from "@rbxts/services";
import { BuildingController } from "server/BuildingController";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Serializer from "shared/Serializer";
import { LogicRegistry } from "shared/block/LogicRegistry";
import blockConfigRegistry, { BlockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import JSON from "shared/fixes/Json";
import Objects from "shared/fixes/objects";

type SerializedBlocks<TBlocks extends SerializedBlockV0> = {
	readonly version: number;
	readonly blocks: readonly TBlocks[];
};

interface SerializedBlockV0 {
	readonly id: (keyof BlockConfigRegistry | keyof LogicRegistry) & string;
	readonly mat: SerializedEnum;
	readonly col: SerializedColor;
	readonly loc: SerializedCFrame;
	readonly config: object | undefined;
}
interface SerializedBlockV2 extends SerializedBlockV0 {
	readonly uuid: string;
}
interface SerializedBlockV3 extends SerializedBlockV2 {
	readonly connections?: Readonly<Record<BlockConnectionName, PlacedBlockDataConnection>>;
}

const createBufferReader = (buf: buffer) => {
	let position = 0;

	return {
		getPosition() {
			return position;
		},
		setPosition(value: number) {
			position = value;
		},
		getBuffer() {
			return buf;
		},

		readi8(): number {
			const ret = buffer.readi8(buf, position);
			position += 1;
			return ret;
		},
		readu8(): number {
			const ret = buffer.readu8(buf, position);
			position += 1;
			return ret;
		},
		readi16(): number {
			const ret = buffer.readi16(buf, position);
			position += 2;
			return ret;
		},
		readu16(): number {
			const ret = buffer.readu16(buf, position);
			position += 2;
			return ret;
		},
		readi32(): number {
			const ret = buffer.readi32(buf, position);
			position += 4;
			return ret;
		},
		readu32(): number {
			const ret = buffer.readu32(buf, position);
			position += 4;
			return ret;
		},
		readf32(): number {
			const ret = buffer.readf32(buf, position);
			position += 4;
			return ret;
		},
		readf64(): number {
			const ret = buffer.readf64(buf, position);
			position += 8;
			return ret;
		},

		readstring(count: number): string {
			const ret = buffer.readstring(buf, position, count);
			position += count;

			return ret;
		},
	};
};
const createBufferWriter = (buf: buffer) => {
	let position = 0;

	return {
		getPosition() {
			return position;
		},
		setPosition(value: number) {
			position = value;
		},
		getBuffer() {
			return buf;
		},

		writei8(value: number): void {
			buffer.writei8(buf, position, value);
			position += 1;
		},
		writeu8(value: number): void {
			buffer.writeu8(buf, position, value);
			position += 1;
		},
		writei16(value: number): void {
			buffer.writei16(buf, position, value);
			position += 2;
		},
		writeu16(value: number): void {
			buffer.writeu16(buf, position, value);
			position += 2;
		},
		writei32(value: number): void {
			buffer.writei32(buf, position, value);
			position += 4;
		},
		writeu32(value: number): void {
			buffer.writeu32(buf, position, value);
			position += 4;
		},
		writef32(value: number): void {
			buffer.writef32(buf, position, value);
			position += 4;
		},
		writef64(value: number): void {
			buffer.writef64(buf, position, value);
			position += 8;
		},

		writestring(value: string, count?: number): void {
			buffer.writestring(buf, position, value, count);
			position += count ?? value.size();
		},
	};
};

const read = {
	blocksFromPlot: <T extends SerializedBlockV0>(
		plot: PlotModel,
		serialize: (block: Model, index: number, buildingCenter: CFrame) => T,
	): readonly T[] => {
		const buildingCenter = (plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part)
			.CFrame;
		return SharedPlots.getPlotBlocks(plot)
			.GetChildren()
			.map((block, i) => serialize(block as Model, i, buildingCenter));
	},

	blockV3: (block: Model, index: number, buildingCenter: CFrame): SerializedBlockV3 => {
		const configattr = block.GetAttribute("config") as string | undefined;
		const connectionsattr = block.GetAttribute("connections") as string | undefined;

		return {
			id: block.GetAttribute("id") as SerializedBlockV0["id"], // Block ID
			mat: block.GetAttribute("material") as SerializedEnum, // Material
			col: HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor, // Color
			loc: Serializer.CFrameSerializer.serialize(buildingCenter.ToObjectSpace(block.GetPivot())), // Position
			config: configattr === undefined ? undefined : JSON.deserialize<object>(configattr as string),
			uuid: block.GetAttribute("uuid") as string,
			connections:
				connectionsattr === undefined
					? undefined
					: (HttpService.JSONDecode(connectionsattr as string) as SerializedBlockV3["connections"]),
		};
	},
} as const;
const place = {
	blocksOnPlot: <T extends SerializedBlockV0>(
		plot: PlotModel,
		data: readonly T[],
		place: (plot: PlotModel, blockData: T, buildingCenter: CFrame) => void,
	) => {
		const buildingCenter = (plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part)
			.CFrame;
		data.forEach((blockData) => place(plot, blockData, buildingCenter));
	},

	blockOnPlotV3: (plot: PlotModel, blockData: SerializedBlockV3, buildingCenter: CFrame) => {
		if (!blockRegistry.has(blockData.id)) {
			Logger.error(`Could not load ${blockData.id} from slot: Block does not exists`);
			return;
		}

		const deserializedData: PlaceBlockRequest = {
			id: blockData.id,
			color: Serializer.Color3Serializer.deserialize(blockData.col),
			material: Serializer.EnumMaterialSerializer.deserialize(blockData.mat),
			location: buildingCenter.ToWorldSpace(Serializer.CFrameSerializer.deserialize(blockData.loc)),
			config: (blockData.config ?? {}) as Readonly<Record<string, string>>,
			uuid: blockData.uuid,
			plot,
		};

		const response = BuildingController.placeBlock(deserializedData);
		if (response.success && response.model && blockData.connections) {
			response.model.SetAttribute("connections", HttpService.JSONEncode(blockData.connections));
		}
	},
} as const;

interface BlockSerializer<TBlocks extends SerializedBlocks<SerializedBlockV0>> {
	readonly version: number;
}
interface UpgradableBlocksSerializer<
	TBlocks extends SerializedBlocks<SerializedBlockV0>,
	TPrev extends BlockSerializer<SerializedBlocks<SerializedBlockV0>>,
> extends BlockSerializer<TBlocks> {
	upgradeFrom(data: string, prev: TPrev extends BlockSerializer<infer T> ? T : never): TBlocks;
}
interface CurrentUpgradableBlocksSerializer<
	TBlocks extends SerializedBlocks<SerializedBlockV0>,
	TPrev extends BlockSerializer<SerializedBlocks<SerializedBlockV0>>,
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
					uuid: tostring(i),
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
									Objects.entries(b.config).map(
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
					config: update(b),
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
						Objects.entries(block.config ?? {}).map(([k, v]) => [k, { type: "number", value: v ?? 0 }]),
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
const v16: CurrentUpgradableBlocksSerializer<SerializedBlocks<SerializedBlockV3>, typeof v15> = {
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
						Objects.entries(block.config ?? {}).map(([k, v]) => [k, { type: "number", value: v ?? 0 }]),
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

const versions = [v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16] as const;
const current = versions[versions.size() - 1] as typeof versions extends readonly [...unknown[], infer T] ? T : never;

const getVersion = (version: number) => versions.find((v) => v.version === version);

/** Methods to save and load buildings */
const BlocksSerializer = {
	version: current.version,

	serialize: function (plot: PlotModel): string {
		return HttpService.JSONEncode(current.read(plot));
	},
	deserialize: function (data: string, plot: PlotModel): number {
		let deserialized = HttpService.JSONDecode(data) as SerializedBlocks<SerializedBlockV0>;
		Logger.info(`Loaded a slot using savev${deserialized.version}`);

		const version = deserialized.version;
		for (let i = version + 1; i <= current.version; i++) {
			const version = getVersion(i);
			if (!version) continue;
			if (!("upgradeFrom" in version)) continue;

			deserialized = version.upgradeFrom(data, deserialized);
			Logger.info(`Upgrading a slot to savev${version.version}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		current.place(deserialized as any, plot);
		return deserialized.blocks.size();
	},
} as const;
export default BlocksSerializer;

/*
const vBUFFER = {
	version: 3,

	serialize(plot: PlotModel): string {
		const blocks = read.blocksFromPlot(plot, read.blockV3);

		const palette = new Map<string, number>(
			[...new Set<string>(blocks.map((b) => b.id))]
				.map((id) => [id, blocks.reduce((acc, val) => acc + (val.id === id ? 1 : 0), 0)] as const)
				.sort((left, right) => left[1] < right[1])
				.map((entry) => entry[0])
				.map((entry, id) => [entry, id] as const),
		);

		const buf = createBufferWriter(buffer.create(1024 * 1024));
		buf.writei8(this.version);

		buf.writeu16(palette.size());
		for (const [id, idx] of palette) {
			buf.writeu16(idx);
			buf.writeu16(id.size());
			buf.writestring(id);
		}

		buf.writeu16(blocks.size());
		for (const block of blocks) {
			buf.writeu16(palette.get(block.id)!);
			buf.writeu16(block.mat);

			const clr = Serializer.Color3Serializer.deserialize(block.col);
			buf.writeu8(clr.R * 255);
			buf.writeu8(clr.G * 255);
			buf.writeu8(clr.B * 255);

			buf.writef32(block.loc[0]);
			buf.writef32(block.loc[1]);
			buf.writef32(block.loc[2]);
			buf.writef32(block.loc[3][0]);
			buf.writef32(block.loc[3][1]);
			buf.writef32(block.loc[3][2]);

			if (!block.config) {
				buf.writeu32(0);
			} else {
				const str = HttpService.JSONEncode(block.config);
				buf.writeu32(str.size());
				buf.writestring(str);
			}
		}

		const buf2 = buffer.create(buf.getPosition());
		buffer.copy(buf2, 0, buf.getBuffer(), 0, buf.getPosition());

		print(Base64.Encode(buffer.tostring(buf2)));
		print(HttpService.JSONEncode(blocks));
		print(Base64.Encode(buffer.tostring(buf2)).size());
		print(HttpService.JSONEncode(blocks).size());
		return buffer.tostring(buf2);
	},
	deserialize(data: string): readonly SerializedBlockV0[] {
		const buf = createBufferReader(buffer.fromstring(data));
		const version = buf.readu8();
		if (version !== 0) throw "invalid save version"; // TODO: check version before

		const palettesize = buf.readu16();
		const palette = new Map<number, string>();
		for (let i = 0; i < palettesize; i++) {
			const idx = buf.readu16();
			const idsize = buf.readu16();
			const id = buf.readstring(idsize);

			palette.set(idx, id);
		}

		const blockssize = buf.readu16();
		const blocks: SerializedBlockV0[] = new Array(blockssize);
		for (let i = 0; i < blockssize; i++) {
			const id = palette.get(buf.readu16())!;
			const mat = buf.readu16();

			const col = Serializer.Color3Serializer.serialize(Color3.fromRGB(buf.readu8(), buf.readu8(), buf.readu8()));

			const loc: SerializedCFrame = [
				buf.readf32(),
				buf.readf32(),
				buf.readf32(),
				[buf.readf32(), buf.readf32(), buf.readf32()],
			];

			const configstrsize = buf.readu32();
			let config: object | undefined = undefined;
			if (configstrsize !== 0) {
				config = HttpService.JSONDecode(buf.readstring(configstrsize)) as object;
			}

			const block: SerializedBlockV0 = { id, mat, col, loc, config };
			blocks.push(block);
		}

		return blocks;
	},
} as const;
*/
