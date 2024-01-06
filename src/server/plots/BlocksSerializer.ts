import { Base64 } from "@rbxts/crypto";
import { HttpService } from "@rbxts/services";
import BuildingWrapper from "server/BuildingWrapper";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Serializer from "shared/Serializer";
import SharedPlots from "shared/building/SharedPlots";

type SerializedBlocks<TBlocks extends SerializedBlockV0> = {
	version: number;
	blocks: readonly TBlocks[];
};

interface SerializedBlockV0 {
	readonly id: string;
	readonly mat: SerializedEnum;
	readonly col: SerializedColor;
	readonly loc: SerializedCFrame;
	readonly config?: object;
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

interface BlocksSerializerVersion {
	readonly version: number;

	/**
	 * @returns Block count
	 */
	deserialize(data: string, plot: PlotModel): number;
}
interface BlocksSerializerCurrentVersion extends BlocksSerializerVersion {
	serialize(plot: PlotModel): string;
}

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

	blockV0: (block: Model, index: number, buildingCenter: CFrame): SerializedBlockV0 => {
		const configattr = block.GetAttribute("config") as string | undefined;

		return {
			id: block.GetAttribute("id") as string, // Block ID
			mat: block.GetAttribute("material") as SerializedEnum, // Material
			col: HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor, // Color
			loc: Serializer.CFrameSerializer.serialize(buildingCenter.ToObjectSpace(block.GetPivot())), // Position
			config:
				configattr === undefined
					? undefined
					: (HttpService.JSONDecode(block.GetAttribute("config") as string) as object),
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

	blockOnPlotV0: (plot: PlotModel, blockData: SerializedBlockV0, buildingCenter: CFrame) => {
		if (!blockRegistry.has(blockData.id)) {
			Logger.error(`Could not load ${blockData.id} from slot: Block does not exists`);
			return;
		}

		const deserializedData: PlaceBlockRequest = {
			block: blockData.id,
			color: Serializer.Color3Serializer.deserialize(blockData.col),
			material: Serializer.EnumMaterialSerializer.deserialize(blockData.mat),
			location: buildingCenter.ToWorldSpace(Serializer.CFrameSerializer.deserialize(blockData.loc)),
			config: (blockData.config ?? {}) as Readonly<Record<string, string>>,
		};

		const response = BuildingWrapper.placeBlock(deserializedData);
		if (response.success && response.model && blockData.config) {
			response.model.SetAttribute("config", HttpService.JSONEncode(blockData.config));
		}
	},
} as const;

const v0: BlocksSerializerVersion = {
	version: 0,

	deserialize(data: string, plot: PlotModel): number {
		const blocks = HttpService.JSONDecode(Base64.Decode(data)) as readonly SerializedBlockV0[];
		place.blocksOnPlot(plot, blocks, place.blockOnPlotV0);

		return blocks.size();
	},
};

/** Removed unnesessary base64 encode/decode */
const v1: BlocksSerializerVersion = {
	version: 1,

	deserialize(data: string, plot: PlotModel): number {
		let blocks = HttpService.JSONDecode(data) as readonly SerializedBlockV0[];
		blocks = blocks.map((b) => {
			if (b.id === "wheel") {
				return {
					...b,
					id: "smallwheel",
				};
			}

			return b;
		});

		place.blocksOnPlot(plot, blocks, place.blockOnPlotV0);

		return blocks.size();
	},
};

/** Updated block 'wheel' > 'smallwheel' */
const v3: BlocksSerializerVersion = {
	version: 3,

	deserialize(data: string, plot: PlotModel): number {
		const blocks = HttpService.JSONDecode(data) as readonly SerializedBlockV0[];
		place.blocksOnPlot(plot, blocks, place.blockOnPlotV0);

		return blocks.size();
	},
};

/** Added versioning */
const v4: BlocksSerializerCurrentVersion = {
	version: 4,

	deserialize(data: string, plot: PlotModel): number {
		const blocks = HttpService.JSONDecode(data) as SerializedBlocks<SerializedBlockV0> | SerializedBlockV0[];
		if (!("version" in blocks) || blocks.version !== this.version) throw "Wrong version";

		place.blocksOnPlot(plot, blocks.blocks, place.blockOnPlotV0);
		return blocks.blocks.size();
	},
	serialize(plot: PlotModel): string {
		const serialized: SerializedBlocks<SerializedBlockV0> = {
			version: this.version,
			blocks: read.blocksFromPlot(plot, read.blockV0),
		};

		return HttpService.JSONEncode(serialized);
	},
};

const versions = [v0, v1, v3, v4] as const;
const current = versions[versions.size() - 1] as BlocksSerializerCurrentVersion;

const BlocksSerializer = {
	version: current.version,

	serialize: function (plot: PlotModel): string {
		return current.serialize(plot);
	},
	deserialize: function (data: string, plot: PlotModel): number {
		for (let i = versions.size() - 1; i >= 0; i--) {
			try {
				const result = versions[i].deserialize(data, plot);
				Logger.info(`Loaded a slot using savev${versions[i].version}`);

				return result;
			} catch (err) {
				Logger.error(`Could not a load slot using savev${versions[i].version}: ${err}`);
			}
		}

		throw "Could not deserialize a slot with any serializer version";
	},
} as const;

export default BlocksSerializer;

const vBUFFER = {
	version: 3,

	serialize(plot: PlotModel): string {
		const blocks = read.blocksFromPlot(plot, read.blockV0);

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
