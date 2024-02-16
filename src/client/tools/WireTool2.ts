import { Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { Colors } from "client/gui/Colors";
import { Element } from "client/gui/Element";
import Gui from "client/gui/Gui";
import BuildingMode from "client/modes/build/BuildingMode";
import { Assert } from "client/test/Assert";
import ToolBase from "client/tools/ToolBase";
import blockConfigRegistry, { BlockConfigRegistryNonGeneric } from "shared/block/config/BlockConfigRegistry";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import ComponentBase from "shared/component/SharedComponentBase";
import ObservableValue from "shared/event/ObservableValue";
import Arrays from "shared/fixes/Arrays";
import Objects from "shared/fixes/objects";

const typeGroups = {
	bool: {
		color: Colors.yellow,
	},
	vector3: {
		color: Colors.pink,
	},
	number: {
		color: Colors.green,
	},
	string: {
		color: Colors.purple,
	},
	never: {
		color: Colors.black,
	},
} as const;
const groups = {
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
	key: "never",
	multikey: "never",
} as const satisfies Record<keyof BlockConfigTypes.Types, keyof typeof typeGroups>;

type DataType = keyof typeof typeGroups;
type MarkerData = {
	//readonly name: string;
	//readonly id: BlockConnectionName;
	readonly blockData: {
		readonly uuid: BlockUuid;
		readonly instance: PVInstance;
	};
	readonly dataTypes: readonly DataType[];
	readonly group: string | undefined;
};
const intersectTypes = (types: readonly (readonly DataType[])[]): readonly DataType[] => {
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
};

type MarkerComponentDefinition = BillboardGui & {
	readonly TextButton: GuiButton & {
		readonly White: Frame;
		readonly Filled: Frame;
	};
};
abstract class MarkerComponent extends ClientComponent<MarkerComponentDefinition> {
	private static getPartMarkerPositions(part: BasePart): Vector3[] {
		const averageSize = (part.Size.X + part.Size.Y + part.Size.Z) / 3;
		const halfSize = averageSize / 2;
		const offset = 0.25;

		return [
			new Vector3(-halfSize + offset, 0, 0),
			new Vector3(halfSize - offset, 0, 0),
			new Vector3(0, 0, -halfSize + offset),
			new Vector3(0, 0, halfSize - offset),
			new Vector3(0, -halfSize + offset, 0),
			new Vector3(0, halfSize - offset, 0),
			new Vector3(0, 0, 0),
		];
	}

	static createInstance(origin: BasePart, offset: Vector3 | number): MarkerComponentDefinition {
		if (typeIs(offset, "number")) {
			offset = this.getPartMarkerPositions(origin)[offset];
		}

		const markerInstance = ReplicatedStorage.Assets.Wires.WireMarker.Clone();

		markerInstance.Adornee = origin;
		markerInstance.Parent = Gui.getGameUI();
		markerInstance.StudsOffsetWorldSpace = origin.CFrame.PointToObjectSpace(
			origin.CFrame.PointToWorldSpace(offset),
		);

		return markerInstance;
	}

	readonly instance;
	readonly data;
	readonly position;
	readonly availableTypes;
	sameGroupMarkers?: readonly MarkerComponent[];

	constructor(instance: MarkerComponentDefinition, data: MarkerData) {
		super(instance);

		this.instance = instance;
		this.data = data;
		this.position = data.blockData.instance.GetPivot().PointToWorldSpace(instance.StudsOffsetWorldSpace);
		this.availableTypes = new ObservableValue<readonly DataType[]>(data.dataTypes);

		this.onPrepare((inputType) => {
			if (inputType === "Gamepad") {
				this.instance.Size = new UDim2(
					this.instance.Size.X.Scale * 1.5,
					this.instance.Size.X.Offset * 1.5,
					this.instance.Size.Y.Scale * 1.5,
					this.instance.Size.Y.Offset * 1.5,
				);
			}
		});

		let loop: (() => void) | undefined;
		this.event.subscribeObservable2(
			this.availableTypes,
			(types) => {
				loop?.();

				if (types.size() === 0) {
					this.instance.TextButton.BackgroundColor3 = this.instance.TextButton.Filled.BackgroundColor3 =
						typeGroups[types[0]].color;
				} else {
					let i = 0;
					loop = this.event.loop(1, () => {
						this.instance.TextButton.BackgroundColor3 = this.instance.TextButton.Filled.BackgroundColor3 =
							typeGroups[types[(i = (i + 1) % types.size())]].color;
					});
				}
			},
			true,
		);
	}

	narrowDownTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		visited.add(this);
		this.narrowDownTypes();

		if (this.sameGroupMarkers) {
			for (const other of this.sameGroupMarkers) {
				if (other === this) continue;
				if (visited.has(other)) continue;

				other.narrowDownTypesSelfAndOther(visited);
			}
		}
	}
	widenTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		visited.add(this);
		this.widenTypes();

		if (this.sameGroupMarkers) {
			for (const other of this.sameGroupMarkers) {
				if (other === this) continue;
				if (visited.has(other)) continue;

				other.widenTypesSelfAndOther(visited);
			}
		}
	}

	abstract narrowDownTypes(): void;
	abstract widenTypes(): void;
}
class InputMarkerComponent extends MarkerComponent {
	private connected?: {
		readonly marker: OutputMarkerComponent;
		readonly wire: WireComponent;
	};

	constructor(gui: MarkerComponentDefinition, data: MarkerData) {
		super(gui, data);

		this.instance.TextButton.White.Visible = true;
		this.updateConnectedVisual(false);
	}

	private updateConnectedVisual(connected: boolean) {
		this.instance.TextButton.Filled.Visible = connected;
	}

	isConnected() {
		return this.connected !== undefined;
	}

	onConnected(marker: OutputMarkerComponent, wire: WireComponent) {
		this.connected = { marker, wire };
		this.updateConnectedVisual(true);
	}
	disconnect() {
		if (!this.connected) return;

		this.updateConnectedVisual(false);
		this.connected.marker.onDisconnected(this);

		this.connected = undefined;
		this.widenTypesSelfAndOther(new Set());
	}

	narrowDownTypes(): void {
		if (!this.connected && (!this.sameGroupMarkers || this.sameGroupMarkers.size() < 2)) {
			this.availableTypes.set(this.data.dataTypes);
			return;
		}

		this.availableTypes.set(
			intersectTypes([
				this.availableTypes.get(),
				this.connected?.marker.availableTypes.get() ?? this.data.dataTypes,
				...(this.sameGroupMarkers?.map((m) => m.availableTypes.get()) ?? []),
			]),
		);
	}
	widenTypes(): void {
		/*if (!this.connected && (!this.sameGroupMarkers || this.sameGroupMarkers.size() < 2)) {
			this.availableTypes.set(this.data.dataTypes);
			return;
		}*/

		this.availableTypes.set(
			intersectTypes([
				this.data.dataTypes,
				this.connected?.marker.data.dataTypes ?? this.data.dataTypes,
				...(this.sameGroupMarkers?.map((m) => m.data.dataTypes) ?? []),
			]),
		);
	}

	narrowDownTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		super.narrowDownTypesSelfAndOther(visited);

		if (this.connected && !visited.has(this.connected.marker)) {
			this.connected.marker.narrowDownTypesSelfAndOther(visited);
		}
	}
	widenTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		super.widenTypesSelfAndOther(visited);

		if (this.connected && !visited.has(this.connected.marker)) {
			this.connected.marker.widenTypesSelfAndOther(visited);
		}
	}
}
class OutputMarkerComponent extends MarkerComponent {
	private readonly connected = new Map<MarkerComponent, WireComponent>();

	constructor(gui: MarkerComponentDefinition, data: MarkerData) {
		super(gui, data);

		this.instance.TextButton.White.Visible = false;
		this.instance.TextButton.Filled.Visible = false;
	}

	connect(marker: InputMarkerComponent, wireParent: ViewportFrame) {
		const wire = this.add(WireComponent.create(this, marker).with((c) => (c.instance.Parent = wireParent)));
		this.connected.set(marker, wire);
		marker.onConnected(this, wire);
		this.narrowDownTypesSelfAndOther(new Set());
	}
	onDisconnected(marker: InputMarkerComponent) {
		const wire = this.connected.get(marker);
		if (!wire) return;

		this.remove(wire);
		this.widenTypesSelfAndOther(new Set([marker]));
	}

	narrowDownTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		super.narrowDownTypesSelfAndOther(visited);

		for (const [marker] of this.connected) {
			if (visited.has(marker)) continue;
			marker.narrowDownTypesSelfAndOther(visited);
		}
	}
	widenTypesSelfAndOther(visited: Set<MarkerComponent>): void {
		super.widenTypesSelfAndOther(visited);

		for (const [marker] of this.connected) {
			if (visited.has(marker)) continue;
			marker.widenTypesSelfAndOther(visited);
		}
	}

	narrowDownTypes(): void {
		if (this.connected.size() === 0 && (!this.sameGroupMarkers || this.sameGroupMarkers.size() < 2)) {
			this.availableTypes.set(this.data.dataTypes);
			return;
		}

		this.availableTypes.set(
			intersectTypes([
				this.availableTypes.get(),
				...Arrays.map(this.connected, (c) => c.availableTypes.get()),
				...(this.sameGroupMarkers?.map((m) => m.availableTypes.get()) ?? []),
			]),
		);
	}
	widenTypes(): void {
		if (this.connected.size() === 0 && (!this.sameGroupMarkers || this.sameGroupMarkers.size() < 2)) {
			this.availableTypes.set(this.data.dataTypes);
			return;
		}

		this.availableTypes.set(
			intersectTypes([
				this.data.dataTypes,
				...Arrays.map(this.connected, (m) => m.data.dataTypes),
				...(this.sameGroupMarkers?.map((m) => m.data.dataTypes) ?? []),
			]),
		);
	}
}

type WireComponentDefinition = Part;
class WireComponent extends ClientComponent<WireComponentDefinition> {
	static createInstance(): WireComponentDefinition {
		return Element.create("Part", {
			Anchored: true,
			CanCollide: false,
			CanQuery: false,
			CanTouch: false,
			CastShadow: false,

			Material: Enum.Material.Neon,
			Transparency: 0.4,
			Shape: Enum.PartType.Cylinder,
		});
	}
	static create(from: OutputMarkerComponent, to: InputMarkerComponent): WireComponent {
		return new WireComponent(this.createInstance(), from, to);
	}

	private readonly types = new ObservableValue<readonly DataType[]>(["bool"]);

	readonly from: OutputMarkerComponent;
	readonly to: InputMarkerComponent;

	constructor(instance: WireComponentDefinition, from: OutputMarkerComponent, to: InputMarkerComponent) {
		super(instance);
		this.from = from;
		this.to = to;

		let loop: (() => void) | undefined;
		this.event.subscribeObservable(
			this.types,
			(types) => {
				loop?.();

				let i = 0;
				loop = this.event.loop(1, () => {
					this.instance.Color =
						typeGroups[types[(i = (i + 1) % (types.size() === 0 ? 1 : types.size()))]]?.color ?? Colors.red;
				});
			},
			true,
		);
		this.event.subscribeObservable(
			from.availableTypes,
			() => this.types.set(intersectTypes([from.availableTypes.get(), to.availableTypes.get()])),
			true,
		);
		this.event.subscribeObservable(
			to.availableTypes,
			() => this.types.set(intersectTypes([from.availableTypes.get(), to.availableTypes.get()])),
			true,
		);

		WireComponent.staticSetPosition(this.instance, from.position, to.position);
	}

	static staticSetPosition(wire: WireComponentDefinition, from: Vector3, to: Vector3) {
		const distance = to.sub(from).Magnitude;

		wire.Size = new Vector3(distance - 0.4, 0.15, 0.15);
		wire.CFrame = new CFrame(from, to).mul(new CFrame(0, 0, -distance / 2)).mul(CFrame.Angles(0, math.rad(90), 0));
	}
}

const canConnect = (output: OutputMarkerComponent, input: InputMarkerComponent): boolean => {
	const isNotConnected = (input: InputMarkerComponent): boolean => {
		return !input.isConnected();
	};
	const areSameType = (output: OutputMarkerComponent, input: InputMarkerComponent): boolean => {
		const intypes = input.availableTypes.get();
		const outtypes = output.availableTypes.get();

		return (
			outtypes.filter((t) => intypes.includes(t)) !== undefined &&
			intypes.filter((t) => outtypes.includes(t)) !== undefined
		);
	};

	return isNotConnected(input) && areSameType(output, input);
};

class WireToolDesktopController extends ComponentBase {
	constructor(markers: readonly MarkerComponent[], wireParent: ViewportFrame) {
		class WireMover extends ClientComponent<WireComponentDefinition> {
			readonly marker;

			constructor(instance: WireComponentDefinition, marker: OutputMarkerComponent) {
				super(instance);
				this.marker = marker;

				this.event.subscribe(RunService.Heartbeat, () => {
					const endPosition =
						hoverMarker !== undefined ? hoverMarker.position : Players.LocalPlayer.GetMouse().Hit.Position;

					WireComponent.staticSetPosition(instance, marker.position, endPosition);
				});
				this.event.subInput((ih) =>
					ih.onMouse1Up(() => {
						if (hoverMarker) {
							this.marker.connect(hoverMarker, wireParent);
						}

						this.destroy();
					}),
				);
			}
		}

		super();

		const currentMoverContainer = new ComponentChild<WireMover>(this);
		let hoverMarker: InputMarkerComponent | undefined;

		for (const marker of markers) {
			if (marker instanceof InputMarkerComponent) {
				this.event.subscribe(marker.instance.TextButton.Activated, () => {
					marker.disconnect();
				});

				this.event.subscribe(marker.instance.TextButton.MouseEnter, () => {
					const currentMove = currentMoverContainer.get();
					if (!currentMove) return;
					if (!canConnect(currentMove.marker, marker)) return;

					hoverMarker = marker;
				});
				this.event.subscribe(marker.instance.TextButton.MouseLeave, () => {
					if (hoverMarker !== marker) return;
					hoverMarker = undefined;
				});
			} else if (marker instanceof OutputMarkerComponent) {
				this.event.subscribe(marker.instance.TextButton.MouseButton1Down, () => {
					if (currentMoverContainer.get()) return;

					const wire = WireComponent.createInstance();
					wire.Parent = wireParent;
					currentMoverContainer.set(new WireMover(wire, marker));
				});
			}
		}
	}
}

/** A tool for wiring */
export default class WireTool2 extends ToolBase {
	readonly wireParent;
	private readonly markers = this.parent(new ComponentKeyedChildren<string, MarkerComponent>(this, true));

	constructor(mode: BuildingMode) {
		super(mode);

		this.wireParent = Element.create("ViewportFrame", {
			Name: "WireViewportFrame",
			Size: UDim2.fromScale(1, 1),
			CurrentCamera: Workspace.CurrentCamera,
			Transparency: 1,
			Parent: Gui.getGameUI(),
			Ambient: Colors.white,
			LightColor: Colors.white,
			ZIndex: -1,
		});

		this.event.onEnable(() => this.createEverything());

		{
			const cic = new ComponentChild(this, true);
			this.event.onPrepareDesktop(() =>
				cic.set(
					new WireToolDesktopController(
						[...this.markers.getAll()].map((e) => e[1]),
						this.wireParent,
					),
				),
			);
		}
	}

	static groupMarkers(markers: readonly MarkerComponent[]) {
		const groupedMarkers = Arrays.groupBy(markers, (m) => m.data.group + " " + m.data.blockData.uuid);
		for (const marker of markers) {
			if (marker.data.group === undefined) continue;
			marker.sameGroupMarkers = groupedMarkers.get(marker.data.group + " " + marker.data.blockData.uuid);
		}
	}

	private createEverything() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId); // for (const plot of SharedPlots.getAllowedPlots(Players.LocalPlayer)) {
		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id];
			if (!configDef) continue;

			let index = 0;
			for (const markerType of ["output", "input"] as const) {
				for (const [key, config] of Objects.pairs(configDef[markerType])) {
					if (config.connectorHidden) continue;

					const data: MarkerData = {
						blockData: block,
						dataTypes:
							config.type === "or" ? config.types.map((t) => groups[t.type]) : [groups[config.type]],
						group: config.type === "or" ? config.group : undefined,
					};

					const markerInstance = MarkerComponent.createInstance(block.instance.PrimaryPart!, index++);
					const marker =
						markerType === "input"
							? new InputMarkerComponent(markerInstance, data)
							: new OutputMarkerComponent(markerInstance, data);

					this.markers.add(block.uuid + key, marker);
				}
			}
		}

		WireTool2.groupMarkers(Arrays.map(this.markers.getAll(), (k, v) => v));

		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
			for (const [connectionName, connection] of Objects.entries(block.connections)) {
				const from = this.markers.get(block.uuid + connectionName) as InputMarkerComponent;
				const to = this.markers.get(connection.blockUuid + connection.connectionName) as OutputMarkerComponent;

				to.connect(from, this.wireParent);
			}
		}
		//}
	}

	getDisplayName(): string {
		return "Wiring (DEV ONLY)";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895880948";
	}

	public getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.ButtonY, text: "Marker selection mode" });
		keys.push({ key: Enum.KeyCode.ButtonA, text: "Click on marker" });
		keys.push({ key: Enum.KeyCode.ButtonX, text: "Cancel selection" });
		keys.push({ key: Enum.KeyCode.ButtonB, text: "Unequip" });

		return keys;
	}

	public getKeyboardTooltips(): readonly { keys: string[]; text: string }[] {
		return [];
	}

	public disable(): void {
		this.markers.clear();
		super.disable();
	}
}

//

export const WireToolTests = {
	connectThrough1() {
		const wireParent = new Instance("ViewportFrame");
		const newinstance = () => MarkerComponent.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Part"),
		});

		const block1 = newdata(1);
		const block2 = newdata(2);

		const in1 = new InputMarkerComponent(newinstance(), {
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in2 = new InputMarkerComponent(newinstance(), {
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});

		const out1 = new OutputMarkerComponent(newinstance(), {
			blockData: block2,
			dataTypes: ["bool"],
			group: undefined,
		});

		WireTool2.groupMarkers([in1, in2, out1]);

		Assert.notNull(in1.sameGroupMarkers);
		Assert.notNull(in2.sameGroupMarkers);
		Assert.null(out1.sameGroupMarkers);
		Assert.sequenceEquals(in1.sameGroupMarkers, [in1, in2]);
		Assert.sequenceEquals(in2.sameGroupMarkers, [in1, in2]);

		//

		out1.connect(in1, wireParent);

		print(in1.availableTypes.get().join());
		print(in2.availableTypes.get().join());
		print(out1.availableTypes.get().join());

		Assert.sequenceEquals(in1.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(in2.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(out1.availableTypes.get(), ["bool"]);
	},
	connectThrough2() {
		const wireParent = new Instance("ViewportFrame");
		const newinstance = () => MarkerComponent.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Part"),
		});

		const block1 = newdata(1);
		const block2 = newdata(2);
		const block3 = newdata(3);

		const in1 = new InputMarkerComponent(newinstance(), {
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in2 = new InputMarkerComponent(newinstance(), {
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in3 = new InputMarkerComponent(newinstance(), {
			blockData: block3,
			dataTypes: ["bool", "number"],
			group: "1",
		});
		const in4 = new InputMarkerComponent(newinstance(), {
			blockData: block3,
			dataTypes: ["bool", "number"],
			group: "1",
		});

		const out1 = new OutputMarkerComponent(newinstance(), {
			blockData: block2,
			dataTypes: ["bool"],
			group: undefined,
		});

		WireTool2.groupMarkers([in1, in2, in3, in4, out1]);

		//

		out1.connect(in3, wireParent);
		out1.connect(in1, wireParent);

		print(in1.availableTypes.get().join());
		print(in2.availableTypes.get().join());
		print(in3.availableTypes.get().join());
		print(in4.availableTypes.get().join());
		print(out1.availableTypes.get().join());

		Assert.sequenceEquals(in1.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(in2.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(in3.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(in4.availableTypes.get(), ["bool"]);
		Assert.sequenceEquals(out1.availableTypes.get(), ["bool"]);
	},
} as const;
