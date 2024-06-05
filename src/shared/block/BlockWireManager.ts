import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ObservableValue } from "shared/event/ObservableValue";
import type { BlockConfigRegistryNonGeneric } from "shared/block/config/BlockConfigRegistry";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { JsonSerializablePrimitive } from "shared/fixes/Json";

export namespace BlockWireManager {
	export type DataType = "bool" | "vector3" | "number" | "string" | "color" | "byte" | "bytearray" | "never";
	export type MarkerData = {
		readonly id: BlockConnectionName;
		readonly name: string;
		readonly blockData: {
			readonly uuid: BlockUuid;
			readonly instance: BlockModel;
		};
		readonly dataTypes: readonly DataType[];
		readonly group: string | undefined;
	};

	export const groups: { readonly [k in keyof BlockConfigTypes.Types]: DataType } = {
		bool: "bool",
		vector3: "vector3",
		keybool: "bool",
		number: "number",
		clampedNumber: "number",
		thrust: "number",
		motorRotationSpeed: "number",
		servoMotorAngle: "number",
		or: "number",
		string: "string",
		color: "color",
		key: "never",
		multikey: "never",
		controllableNumber: "number",
		byte: "byte",
		bytearray: "bytearray",
	};

	export function intersectTypes(types: readonly (readonly DataType[])[]): readonly DataType[] {
		if (types.size() === 1) {
			return types[0];
		}

		let result: readonly DataType[] | undefined;
		for (const typearr of types) {
			if (!result) {
				result = typearr;
				continue;
			}
			if (result.size() === 0) {
				break;
			}

			const setA = new Set(typearr);
			result = result.filter((value) => setA.has(value));
		}

		if (!result) {
			throw "AAAAAAAAAAAAAAAAAAAAA";
		}

		return result;
	}
	export function canConnect(output: Markers.Marker, input: Markers.Input): boolean {
		const isNotConnected = (input: Markers.Input): boolean => {
			return !input.isConnected();
		};
		const areSameType = (output: Markers.Marker, input: Markers.Input): boolean => {
			const intypes = input.availableTypes.get();
			const outtypes = output.availableTypes.get();

			return (
				outtypes.find((t) => intypes.includes(t)) !== undefined &&
				intypes.find((t) => outtypes.includes(t)) !== undefined
			);
		};

		return isNotConnected(input) && areSameType(output, input);
	}

	export function fromPlot(plot: SharedPlot) {
		const toNarrow: Markers.Marker[] = [];
		const markersByBlock = new Map<BlockUuid, (Markers.Input | Markers.Output)[]>();
		const markers = new Map<string, Markers.Marker>();

		for (const block of plot.getBlockDatas()) {
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id];
			if (!configDef) continue;

			for (const markerType of ["output", "input"] as const) {
				for (const [key, config] of pairs(configDef[markerType])) {
					let narrow = false;
					let dataTypes: readonly DataType[];
					if (config.type === "or") {
						const existingcfg = (
							block.config as Record<string, typeof config.config & defined & JsonSerializablePrimitive>
						)[key];

						if (existingcfg === undefined || existingcfg.type === "unset") {
							dataTypes = asMap(config.types).map((k) => groups[k]);
						} else {
							dataTypes = [groups[existingcfg.type]];
							narrow = true;
						}
					} else {
						dataTypes = [groups[config.type]];
					}

					const data: MarkerData = {
						blockData: block,
						dataTypes,
						group: config.type === "or" ? config.group : undefined,
						id: key as BlockConnectionName,
						name: config.displayName,
					};

					const marker = markerType === "input" ? new Markers.Input(data) : new Markers.Output(data);
					markers.set(`${block.uuid} ${markerType} ${key}`, marker);

					{
						let bb = markersByBlock.get(block.uuid);
						if (!bb) markersByBlock.set(block.uuid, (bb = []));

						bb.push(marker);
					}

					if (narrow) {
						toNarrow.push(marker);
					}
				}
			}
		}

		groupMarkers(markers.values());

		for (const block of plot.getBlockDatas()) {
			if (block.connections === undefined) continue;

			for (const [connectionName, connection] of pairs(block.connections)) {
				const fromstr = `${block.uuid} input ${connectionName}`;
				const tostr = `${connection.blockUuid} output ${connection.connectionName}`;

				const from = markers.get(fromstr) as Markers.Input;
				if (!from) throw `Not found '${fromstr}' to '${tostr}'`;
				const to = markers.get(tostr) as Markers.Output;
				if (!to) throw `Not found '${tostr}' from '${fromstr}'`;

				to.connect(from);
			}
		}

		for (const marker of toNarrow) {
			marker.narrowDownTypesSelfAndOther();
		}

		return markersByBlock;
	}
	export function groupMarkers(markers: readonly Markers.Marker[]) {
		const groupedMarkers = markers.groupBy((m) => m.data.group + " " + m.data.blockData.uuid);
		for (const marker of markers) {
			if (marker.data.group === undefined) continue;
			marker.sameGroupMarkers = groupedMarkers.get(marker.data.group + " " + marker.data.blockData.uuid);
		}
	}

	export namespace Markers {
		export abstract class Marker {
			private readonly _availableTypes;
			readonly availableTypes;
			sameGroupMarkers?: readonly Marker[];

			constructor(readonly data: MarkerData) {
				this._availableTypes = new ObservableValue<readonly DataType[]>(data.dataTypes);
				this.availableTypes = this._availableTypes.asReadonly();
			}

			narrowDownTypesSelfAndOther(): void {
				const grouped = this.getFullSameGroupTree();
				const types = intersectTypes(grouped.map((m) => m.availableTypes.get()));

				this._availableTypes.set(types);
				for (const marker of grouped) {
					marker._availableTypes.set(types);
				}
			}
			widenTypesSelfAndOther(): void {
				const grouped = this.getFullSameGroupTree();
				const types = intersectTypes(grouped.map((m) => m.data.dataTypes));

				this._availableTypes.set(types);
				for (const marker of grouped) {
					marker._availableTypes.set(types);
				}
			}

			getFullSameGroupTree(): ReadonlySet<Marker> {
				const set = new Set<Marker>();
				const addd = (marker: Marker) => {
					if (set.has(marker)) return;
					set.add(marker);

					for (const m of marker.getConnected()) {
						addd(m);
					}

					if (marker.sameGroupMarkers) {
						for (const m of marker.sameGroupMarkers) {
							addd(m);
						}
					}
				};
				const add = (addset: ReadonlySet<Marker>) => {
					for (const marker of addset) {
						if (set.has(marker)) continue;

						set.add(marker);
						add(marker.getConnected());
						if (marker.sameGroupMarkers) {
							add(new Set(marker.sameGroupMarkers));
						}
					}
				};

				addd(this);
				return set;
			}

			abstract getConnected(): ReadonlySet<Marker>;
		}
		export class Input extends Marker {
			private readonly _connected = new ObservableValue<Output | undefined>(undefined);
			readonly connected = this._connected.asReadonly();

			isConnected() {
				return this._connected.get() !== undefined;
			}

			onConnected(marker: Output) {
				this._connected.set(marker);
			}
			disconnect() {
				const prev = this._connected.get();
				if (!prev) return;

				this._connected.set(undefined);
				prev.onDisconnected(this);
				this.widenTypesSelfAndOther();
			}

			getConnected(): ReadonlySet<Marker> {
				return new Set(this._connected.get() ? [this._connected.get()!] : []);
			}
		}
		export class Output extends Marker {
			private readonly connected = new Set<Marker>();

			connect(marker: Input) {
				this.connected.add(marker);
				marker.onConnected(this);
				this.narrowDownTypesSelfAndOther();
			}
			onDisconnected(marker: Input) {
				if (this.connected.has(marker)) {
					return;
				}

				this.connected.delete(marker);
				this.widenTypesSelfAndOther();
			}

			getConnected(): ReadonlySet<Marker> {
				return this.connected;
			}
		}
	}
}
