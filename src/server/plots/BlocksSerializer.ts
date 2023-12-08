import { Base64 } from "@rbxts/crypto";
import { HttpService } from "@rbxts/services";
import BuildingWrapper from "server/BuildingWrapper";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Serializer from "shared/Serializer";
import SharedPlots from "shared/building/SharedPlots";

export type SerializedBlocks = [
	version: 0,
	palette: readonly string[],
	blocks: readonly (SerializedBlock & { id: number })[],
];

export type SerializedBlock = {
	id: string;
	mat: SerializedEnum;
	col: SerializedColor;
	loc: SerializedCFrame;
	config?: object;
};

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

export default class BlocksSerializer {
	static readonly v0 = {
		version: 0,

		serialize(plot: Model): string {
			const blocks = BlocksSerializer.serialize(plot);
			return HttpService.JSONEncode(blocks);

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
		deserialize(data: string): readonly SerializedBlock[] {
			return HttpService.JSONDecode(data) as readonly SerializedBlock[];

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
			const blocks: SerializedBlock[] = new Array(blockssize);
			for (let i = 0; i < blockssize; i++) {
				const id = palette.get(buf.readu16())!;
				const mat = buf.readu16();

				const col = Serializer.Color3Serializer.serialize(
					Color3.fromRGB(buf.readu8(), buf.readu8(), buf.readu8()),
				);

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

				const block: SerializedBlock = { id, mat, col, loc, config };
				blocks.push(block);
			}

			return blocks;
		},
	} as const;

	static readonly current = this.v0;

	static serialize(plot: Model): readonly SerializedBlock[] {
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		const data: SerializedBlock[] = [];
		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;
			const pivot = block.GetPivot();
			const buildingCenter = plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part;

			const relativeOrientation = buildingCenter.CFrame.ToObjectSpace(pivot).LookVector;
			const relativePosition = buildingCenter.CFrame.ToObjectSpace(pivot);

			const blockData: SerializedBlock = {
				id: block.GetAttribute("id") as string, // Block ID
				mat: block.GetAttribute("material") as SerializedEnum, // Material
				col: HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor, // Color
				loc: Serializer.CFrameSerializer.serialize(relativePosition), // Position
			};

			if (block.GetAttribute("config") !== undefined) {
				blockData["config"] = HttpService.JSONDecode(block.GetAttribute("config") as string) as object;
			}

			data.push(blockData);
		}

		return data;
	}

	static deserialize(plot: Model, data: readonly SerializedBlock[]): Model {
		const buildingCenter = plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part;

		for (let i = 0; i < data.size(); i++) {
			const blockData = data[i];

			if (!blockRegistry.has(blockData.id)) {
				Logger.error(`Could not load ${blockData.id} from slot: not exists`);
				continue;
			}

			const loc = Serializer.CFrameSerializer.deserialize(blockData.loc);

			const deserializedData: PlaceBlockRequest = {
				block: blockData.id,
				color: Serializer.Color3Serializer.deserialize(blockData.col),
				material: Serializer.EnumMaterialSerializer.deserialize(blockData.mat),
				location: buildingCenter.CFrame.ToWorldSpace(loc),
			};

			const response = BuildingWrapper.placeBlock(deserializedData);
			if (response.success && response.model && blockData.config) {
				response.model.SetAttribute("config", HttpService.JSONEncode(blockData.config));
			}
		}

		return plot;
	}
}
