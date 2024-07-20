import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingDiffer } from "shared/building/BuildingDiffer";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

export namespace TutorialCreator {
	let before: LatestSerializedBlocks | undefined;

	function toTsCode(obj: unknown): string {
		const mapObjectProperties = (obj: object) =>
			`${asMap(obj)
				.map((k, v) => `${k}: ${toTsCode(v)}`)
				.join(",\n")}`;
		const radToDeg = (angle: number) => {
			// special case for -0
			if (angle === 0) return "0";

			return `math.rad(${math.round(math.deg(angle))})`;
		};

		// print uuid first
		if (typeIs(obj, "table") && "uuid" in obj) {
			return `{ uuid: ${toTsCode(obj.uuid)}, ${mapObjectProperties({ ...obj, uuid: undefined })} }`;
		}

		if (typeIs(obj, "string")) return `"${obj}"`;
		if (typeIs(obj, "number")) return tostring(obj);
		if (typeIs(obj, "boolean")) return tostring(obj);
		if (typeIs(obj, "table")) {
			if (1 in obj) {
				return `[ ${asMap(obj)
					.map((k, v) => toTsCode(v))
					.join(",\n")} ]`;
			}

			return `{ ${mapObjectProperties(obj)} }`;
		}
		if (typeIs(obj, "CFrame")) {
			const [xa, ya, za] = obj.ToOrientation();
			if (xa === 0 && ya === 0 && za === 0) {
				return `new CFrame(${obj.X}, ${obj.Y}, ${obj.Z})`;
			}

			const components = obj.GetComponents();
			return `new CFrame(${components.join()})`;
		}
		if (typeIs(obj, "Vector3")) {
			return `new Vector3(${obj.X}, ${obj.Y}, ${obj.Z})`;
		}
		if (typeIs(obj, "Vector2")) {
			return `new Vector2(${obj.X}, ${obj.Y})`;
		}

		return tostring(obj);
	}

	export function setBefore(plot: ReadonlyPlot): void {
		before = BlocksSerializer.serializeToObject(plot);
	}
	export function serializeDiffToTsCode(plot: ReadonlyPlot): string {
		const serialized = BlocksSerializer.serializeToObject(plot);
		const diff = BuildingDiffer.diff(
			(before ?? { version: serialized.version, blocks: [] }).blocks,
			serialized.blocks,
		);

		return toTsCode(diff);
	}
	export function serializePlotToTsCode(plot: ReadonlyPlot): string {
		return toTsCode(BlocksSerializer.serializeToObject(plot));
	}
}
