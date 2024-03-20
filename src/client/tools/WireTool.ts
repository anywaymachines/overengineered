import { GamepadService, Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientInstanceComponent } from "client/component/ClientInstanceComponent";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { Assert } from "client/test/Assert";
import ToolBase from "client/tools/ToolBase";
import { Element } from "shared/Element";
import Remotes from "shared/Remotes";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import blockConfigRegistry, { BlockConfigRegistryNonGeneric } from "shared/block/config/BlockConfigRegistry";
import SharedPlots from "shared/building/SharedPlots";
import { Component } from "shared/component/Component";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
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
	readonly id: BlockConnectionName;
	readonly name: string;
	readonly blockData: {
		readonly uuid: BlockUuid;
		readonly instance: BlockModel;
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

const looped = new Map<Markers.Marker | WireComponent, (index: number) => void>();
spawn(() => {
	let loopindex = 0;
	while (true as boolean) {
		task.wait(0.5);

		loopindex++;
		for (const [_, value] of looped) {
			value(loopindex);
		}
	}
});

namespace Markers {
	type MarkerComponentDefinition = BillboardGui & {
		readonly TextButton: GuiButton & {
			readonly White: Frame;
			readonly Filled: Frame;
		};
	};
	export abstract class Marker extends ClientInstanceComponent<MarkerComponentDefinition> {
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

		static createInstance(origin: BasePart, offset: Vector3 | number | "center"): MarkerComponentDefinition {
			if (typeIs(offset, "number")) {
				offset = this.getPartMarkerPositions(origin)[offset];
			}
			if (offset === "center") {
				offset = Vector3.zero;
			}

			const markerInstance = ReplicatedStorage.Assets.Wires.WireMarker.Clone();

			markerInstance.MaxDistance = 200;
			markerInstance.Adornee = origin;
			markerInstance.StudsOffsetWorldSpace = origin.CFrame.PointToObjectSpace(
				origin.CFrame.PointToWorldSpace(offset),
			);

			return markerInstance;
		}

		readonly instance;
		readonly data;
		readonly plot;
		readonly position;
		readonly availableTypes;
		sameGroupMarkers?: readonly Marker[];
		protected pauseColors = false;

		constructor(instance: MarkerComponentDefinition, data: MarkerData, plot: PlotModel) {
			super(instance);

			this.onEnable(() => (this.instance.Enabled = true));
			this.onDisable(() => (this.instance.Enabled = false));

			this.instance = instance;
			this.data = data;
			this.plot = plot;
			this.position = data.blockData.instance.GetPivot().PointToWorldSpace(instance.StudsOffsetWorldSpace);
			this.availableTypes = new ObservableValue<readonly DataType[]>(data.dataTypes);

			this.initTooltips();
			this.initColors();
		}

		private initTooltips() {
			const tooltipParent = new ComponentChild<Control<TextLabel>>(this, true);
			const createTooltip = () => {
				const control = new Control(
					ReplicatedAssets.get<{ Wires: { WireInfoLabel: TextLabel } }>().Wires.WireInfoLabel.Clone(),
				);
				control.getGui().Text = this.data.name;
				control.getGui().Parent = this.instance;
				control.getGui().AnchorPoint = new Vector2(0.5, 0.98); // can't set Y to 1 because then it doesn't render
				control.getGui().Position = new UDim2(0.5, 0, 0, 0);
				control.getGui().Size = new UDim2(2, 0, 1, 0);

				tooltipParent.set(control);
			};
			const removeTooltip = () => tooltipParent.clear();

			this.onPrepare((inputType) => {
				if (inputType === "Desktop") {
					this.eventHandler.subscribe(this.instance.TextButton.MouseEnter, createTooltip);
					this.eventHandler.subscribe(this.instance.TextButton.MouseLeave, removeTooltip);
				} else if (inputType === "Touch") {
					createTooltip();
				} else if (inputType === "Gamepad") {
					this.eventHandler.subscribe(this.instance.TextButton.MouseEnter, createTooltip);
					this.eventHandler.subscribe(this.instance.TextButton.MouseLeave, removeTooltip);
				}

				if (inputType === "Gamepad") {
					this.instance.Size = new UDim2(
						this.instance.Size.X.Scale * 1.5,
						this.instance.Size.X.Offset * 1.5,
						this.instance.Size.Y.Scale * 1.5,
						this.instance.Size.Y.Offset * 1.5,
					);
				}
			});
		}
		private initColors() {
			let loop: (() => void) | undefined;

			this.onDestroy(() => loop?.());
			this.event.subscribeObservable2(
				this.availableTypes,
				(types) => {
					loop?.();
					const setcolor = (color: Color3) => {
						this.instance.TextButton.BackgroundColor3 = color;
						this.instance.TextButton.Filled.BackgroundColor3 = color;
					};

					if (types.size() === 1) {
						setcolor(typeGroups[types[0]].color);
					} else {
						const func = (index: number) => {
							if (this.pauseColors) return;
							setcolor(typeGroups[types[index % types.size()]].color);
						};

						looped.set(this, func);
						loop = () => looped.delete(this);
					}
				},
				true,
				true,
			);
		}

		narrowDownTypesSelfAndOther(): void {
			const grouped = this.getFullSameGroupTree();
			const types = intersectTypes(grouped.map((m) => m.availableTypes.get()));

			this.availableTypes.set(types);
			for (const marker of grouped) {
				marker.availableTypes.set(types);
			}
		}
		widenTypesSelfAndOther(): void {
			const grouped = this.getFullSameGroupTree();
			const types = intersectTypes(grouped.map((m) => m.data.dataTypes));

			this.availableTypes.set(types);
			for (const marker of grouped) {
				marker.availableTypes.set(types);
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
		private connected?: {
			readonly marker: Output;
			readonly wire: WireComponent;
		};

		constructor(gui: MarkerComponentDefinition, data: MarkerData, plot: PlotModel) {
			super(gui, data, plot);

			this.instance.TextButton.White.Visible = true;
			this.updateConnectedVisual(false);
		}

		private updateConnectedVisual(connected: boolean) {
			this.instance.TextButton.Filled.Visible = connected;
		}

		isConnected() {
			return this.connected !== undefined;
		}

		onConnected(marker: Output, wire: WireComponent) {
			this.connected = { marker, wire };
			this.updateConnectedVisual(true);
		}
		disconnect() {
			if (!this.connected) return;

			this.updateConnectedVisual(false);

			const connected = this.connected.marker;
			this.connected = undefined;

			connected.onDisconnected(this);
			this.widenTypesSelfAndOther();
		}

		getConnected(): ReadonlySet<Marker> {
			return new Set(this.connected ? [this.connected.marker] : []);
		}
	}
	export class Output extends Marker {
		private readonly connected = new Map<Marker, WireComponent>();

		constructor(gui: MarkerComponentDefinition, data: MarkerData, plot: PlotModel) {
			super(gui, data, plot);

			this.instance.TextButton.White.Visible = false;
			this.instance.TextButton.Filled.Visible = false;
		}

		highlight() {
			this.pauseColors = true;
			this.instance.TextButton.BackgroundColor3 = Colors.red;
		}
		unhighlight() {
			this.pauseColors = false;
			this.instance.TextButton.BackgroundColor3 = typeGroups[this.availableTypes.get()[0]].color;
		}

		hideWires() {
			for (const child of this.children.getAll()) {
				child.disable();
			}
		}
		enable() {
			// show hidden wires
			if (this.isEnabled()) {
				for (const child of this.children.getAll()) {
					child.enable();
				}
			}

			super.enable();
		}

		connect(marker: Input, wireParent: ViewportFrame) {
			const wire = this.add(WireComponent.create(this, marker).with((c) => (c.instance.Parent = wireParent)));
			this.connected.set(marker, wire);
			marker.onConnected(this, wire);
			this.narrowDownTypesSelfAndOther();
		}
		onDisconnected(marker: Input) {
			const wire = this.connected.get(marker);
			if (!wire) return;

			this.connected.delete(marker);
			this.remove(wire);
			this.widenTypesSelfAndOther();
		}

		getConnected(): ReadonlySet<Marker> {
			return new Set(this.connected.keys());
		}
	}
}

type WireComponentDefinition = Part;
class WireComponent extends ClientInstanceComponent<WireComponentDefinition> {
	private static readonly visibleTransparency = 0.4;
	static createInstance(): WireComponentDefinition {
		return Element.create("Part", {
			Anchored: true,
			CanCollide: false,
			CanQuery: false,
			CanTouch: false,
			CastShadow: false,

			Material: Enum.Material.Neon,
			Transparency: this.visibleTransparency,
			Shape: Enum.PartType.Cylinder,
		});
	}
	static create(from: Markers.Output, to: Markers.Input): WireComponent {
		return new WireComponent(this.createInstance(), from, to);
	}

	private readonly types;

	readonly from: Markers.Output;
	readonly to: Markers.Input;

	constructor(instance: WireComponentDefinition, from: Markers.Output, to: Markers.Input) {
		super(instance);
		this.from = from;
		this.to = to;
		this.types = new ObservableValue(from.availableTypes.get());

		this.onEnable(() => (this.instance.Transparency = WireComponent.visibleTransparency));
		this.onDisable(() => (this.instance.Transparency = 1));

		let loop: (() => void) | undefined;
		this.onDestroy(() => loop?.());
		this.event.subscribeObservable2(
			this.types,
			(types) => {
				loop?.();
				const setcolor = (color: Color3) => (this.instance.Color = color);

				if (types.size() === 1) {
					setcolor(typeGroups[types[0]].color);
				} else {
					const func = (index: number) =>
						setcolor(
							typeGroups[types[index % (types.size() === 0 ? 1 : types.size())]]?.color ?? Colors.red,
						);

					looped.set(this, func);
					loop = () => looped.delete(this);
				}
			},
			true,
			true,
		);

		// markers share the availableTypes anyways so there's no need to intersect them
		this.event.subscribeObservable2(from.availableTypes, () => this.types.set(from.availableTypes.get()), true);
		this.event.subscribeObservable2(to.availableTypes, () => this.types.set(to.availableTypes.get()), true);

		WireComponent.staticSetPosition(this.instance, from.position, to.position);
	}

	static staticSetPosition(wire: WireComponentDefinition, from: Vector3, to: Vector3) {
		const distance = to.sub(from).Magnitude;

		wire.Size = new Vector3(distance - 0.4, 0.15, 0.15);
		wire.CFrame = new CFrame(from, to).mul(new CFrame(0, 0, -distance / 2)).mul(CFrame.Angles(0, math.rad(90), 0));
	}
}

const canConnect = (output: Markers.Output, input: Markers.Input): boolean => {
	const isNotConnected = (input: Markers.Input): boolean => {
		return !input.isConnected();
	};
	const areSameType = (output: Markers.Output, input: Markers.Input): boolean => {
		const intypes = input.availableTypes.get();
		const outtypes = output.availableTypes.get();

		return (
			outtypes.find((t) => intypes.includes(t)) !== undefined &&
			intypes.find((t) => outtypes.includes(t)) !== undefined
		);
	};

	return isNotConnected(input) && areSameType(output, input);
};

namespace Controllers {
	const connectMarkers = (from: Markers.Output, to: Markers.Input, wireParent: ViewportFrame) => {
		if (from.plot !== to.plot) {
			throw "Interplot connections are not supported";
		}

		from.connect(to, wireParent);
		spawn(async () => {
			const result = await Remotes.Client.GetNamespace("Building").Get("LogicConnect").CallServerAsync({
				plot: from.plot,
				inputBlock: to.data.blockData.instance,
				inputConnection: to.data.id,
				outputBlock: from.data.blockData.instance,
				outputConnection: from.data.id,
			});

			if (!result.success) {
				LogControl.instance.addLine(result.message, Colors.red);
			}
		});
	};
	const disconnectMarker = (marker: Markers.Input) => {
		marker.disconnect();

		spawn(async () => {
			const result = await Remotes.Client.GetNamespace("Building").Get("LogicDisconnect").CallServerAsync({
				plot: marker.plot,
				inputBlock: marker.data.blockData.instance,
				inputConnection: marker.data.id,
			});

			if (!result.success) {
				LogControl.instance.addLine(result.message, Colors.red);
			}
		});
	};
	const hideNonConnectableMarkers = (from: Markers.Output, markers: readonly Markers.Marker[]) => {
		for (const marker of markers) {
			if (marker === from) {
				if (marker instanceof Markers.Output) {
					marker.hideWires();
				}

				continue;
			}
			if (marker instanceof Markers.Output || (marker instanceof Markers.Input && !canConnect(from, marker))) {
				marker.disable();
			}
		}
	};
	const showAllMarkers = (markers: readonly Markers.Marker[]) => {
		for (const marker of markers) {
			marker.enable();
		}
	};

	export interface IController extends IComponent {
		readonly selectedMarker: ReadonlyObservableValue<Markers.Output | undefined>;

		stopDragging(): void;
	}
	export class Desktop extends ClientComponent implements IController {
		readonly selectedMarker = new ObservableValue<Markers.Output | undefined>(undefined);
		private readonly currentMoverContainer;

		constructor(markers: readonly Markers.Marker[], wireParent: ViewportFrame) {
			class WireMover extends ClientInstanceComponent<WireComponentDefinition> {
				readonly marker;

				constructor(instance: WireComponentDefinition, marker: Markers.Output) {
					super(instance);
					this.marker = marker;

					hideNonConnectableMarkers(marker, markers);
					this.onDestroy(() => showAllMarkers(markers));

					this.event.subscribe(RunService.Heartbeat, () => {
						const endPosition =
							hoverMarker !== undefined
								? hoverMarker.position
								: Players.LocalPlayer.GetMouse().Hit.Position;

						WireComponent.staticSetPosition(instance, marker.position, endPosition);
					});
					this.event.subInput((ih) =>
						ih.onMouse1Up(() => {
							if (hoverMarker) {
								connectMarkers(this.marker, hoverMarker, wireParent);
							}

							this.destroy();
						}),
					);
					this.event.subInput((ih) =>
						ih.onMouse2Down(() => {
							if (hoverMarker) {
								connectMarkers(this.marker, hoverMarker, wireParent);
							}
						}),
					);
				}
			}

			super();

			const currentMoverContainer = new ComponentChild<WireMover>(this, true);
			this.currentMoverContainer = currentMoverContainer;
			currentMoverContainer.childSet.Connect((child) => this.selectedMarker.set(child?.marker));
			let hoverMarker: Markers.Input | undefined;

			for (const marker of markers) {
				if (marker instanceof Markers.Input) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						disconnectMarker(marker);
					});

					this.event.subscribe(marker.instance.TextButton.MouseEnter, () => {
						const currentMove = currentMoverContainer.get();
						if (!currentMove) return;

						hoverMarker = marker;
					});
					this.event.subscribe(marker.instance.TextButton.MouseLeave, () => {
						if (hoverMarker !== marker) return;
						hoverMarker = undefined;
					});
				} else if (marker instanceof Markers.Output) {
					this.event.subscribe(marker.instance.TextButton.MouseButton1Down, () => {
						if (currentMoverContainer.get()) return;

						const wire = WireComponent.createInstance();
						wire.Parent = wireParent;
						currentMoverContainer.set(new WireMover(wire, marker));
					});
				}
			}
		}

		stopDragging() {
			this.currentMoverContainer.clear();
		}
	}
	export class Touch extends Component implements IController {
		readonly selectedMarker = new ObservableValue<Markers.Output | undefined>(undefined);
		private readonly markers: readonly Markers.Marker[];

		constructor(markers: readonly Markers.Marker[], wireParent: ViewportFrame) {
			super();
			this.markers = markers;

			this.onDisable(() => this.unset());

			for (const marker of markers) {
				if (marker instanceof Markers.Input) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						const selected = this.selectedMarker.get();
						if (!selected) {
							disconnectMarker(marker);
							return;
						}

						connectMarkers(selected!, marker, wireParent);
						this.unset();
					});
				} else if (marker instanceof Markers.Output) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						if (this.selectedMarker.get()) this.unset();
						else this.set(marker);
					});
				}
			}
		}

		private set(marker: Markers.Output) {
			this.selectedMarker.set(marker);
			marker.highlight();
			hideNonConnectableMarkers(marker, this.markers);
		}
		private unset() {
			if (this.selectedMarker.get()?.isDestroyed()) return;
			this.selectedMarker.get()?.unhighlight();
			this.selectedMarker.set(undefined);

			showAllMarkers(this.markers);
		}

		stopDragging() {
			this.unset();
		}
	}
	export class Gamepad extends Desktop implements IController {
		constructor(markers: readonly Markers.Marker[], wireParent: ViewportFrame) {
			super(markers, wireParent);

			this.event.onKeyDown("ButtonY", () => {
				if (GamepadService.GamepadCursorEnabled) {
					GamepadService.DisableGamepadCursor();
				} else {
					GamepadService.EnableGamepadCursor(undefined);
				}
			});

			this.onDisable(() => GamepadService.DisableGamepadCursor());
		}
	}
}

/** A tool for wiring */
export class WireTool extends ToolBase {
	readonly selectedMarker = new ObservableValue<Markers.Output | undefined>(undefined);
	readonly markerParent;
	readonly wireParent;
	private readonly markers = this.parent(new ComponentKeyedChildren<string, Markers.Marker>(this, true));
	private readonly controllerContainer = new ComponentChild<Controllers.IController>(this, true);

	constructor(mode: BuildingMode) {
		super(mode);

		this.markerParent = Element.create("ScreenGui", {
			Name: "WireToolMarkers",
			ScreenInsets: Enum.ScreenInsets.None,
			IgnoreGuiInset: true,
			DisplayOrder: -1, // to not draw on top of the wires
			Parent: Gui.getPlayerGui(),
		});
		this.wireParent = Element.create("ViewportFrame", {
			Name: "WireViewportFrame",
			Size: UDim2.fromScale(1, 1),
			CurrentCamera: Workspace.CurrentCamera,
			Transparency: 1,
			Parent: this.markerParent,
			Ambient: Colors.white,
			LightColor: Colors.white,
			ZIndex: -1,
		});

		this.onEnable(() => this.createEverything());
		this.onDisable(() => this.markers.clear());

		{
			const controllers = {
				Desktop: Controllers.Desktop,
				Touch: Controllers.Touch,
				Gamepad: Controllers.Gamepad,
			} as const satisfies Record<
				InputType,
				new (markers: readonly Markers.Marker[], wireParent: ViewportFrame) => Controllers.IController
			>;

			this.event.onPrepare((inputType) => {
				const controller = this.controllerContainer.set(
					new controllers[inputType](this.markers.getAll().values(), this.wireParent),
				);

				controller.selectedMarker.subscribe((m) => this.selectedMarker.set(m), true);
			});
		}
	}

	static groupMarkers(markers: readonly Markers.Marker[]) {
		const groupedMarkers = markers.groupBy((m) => m.data.group + " " + m.data.blockData.uuid);
		for (const marker of markers) {
			if (marker.data.group === undefined) continue;
			marker.sameGroupMarkers = groupedMarkers.get(marker.data.group + " " + marker.data.blockData.uuid);
		}
	}

	stopDragging() {
		this.controllerContainer.get()?.stopDragging();
	}

	private createEverything() {
		this.createEverythingOnPlot(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
	}
	private createEverythingOnPlot(plot: PlotModel) {
		const toNarrow: Markers.Marker[] = [];

		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id];
			if (!configDef) continue;

			let index = 0;
			const entriesSize = (["output", "input"] as const).flatmap((t) => Objects.entries(configDef[t])).size();
			for (const markerType of ["output", "input"] as const) {
				for (const [key, config] of Objects.pairs(configDef[markerType])) {
					if (config.connectorHidden) continue;

					let narrow = false;
					let dataTypes: readonly DataType[];
					if (config.type === "or") {
						const existingcfg = (block.config as Record<string, typeof config.config | undefined>)[key];

						if (!existingcfg || existingcfg.type === "unset") {
							dataTypes = Objects.keys(config.types).map((k) => groups[k]);
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

					const markerInstance = Markers.Marker.createInstance(
						block.instance.PrimaryPart!,
						entriesSize === 1 ? "center" : index++,
					);
					const marker =
						markerType === "input"
							? new Markers.Input(markerInstance, data, plot)
							: new Markers.Output(markerInstance, data, plot);

					if (narrow) {
						toNarrow.push(marker);
					}
					marker.instance.Parent = this.markerParent;
					this.markers.add(`${block.uuid} ${markerType} ${key}`, marker);
				}
			}
		}

		WireTool.groupMarkers(this.markers.getAll().values());

		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
			if (block.connections === undefined) continue;

			for (const [connectionName, connection] of Objects.entries(block.connections)) {
				const from = this.markers.get(`${block.uuid} input ${connectionName}`) as Markers.Input;
				const to = this.markers.get(
					`${connection.blockUuid} output ${connection.connectionName}`,
				) as Markers.Output;

				to.connect(from, this.wireParent);
			}
		}

		for (const marker of toNarrow) {
			marker.narrowDownTypesSelfAndOther();
		}
	}

	getDisplayName(): string {
		return "Wire";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895880948";
	}

	protected getTooltips(): InputTooltips {
		return {
			Gamepad: [
				{ keys: ["ButtonY"], text: "Marker selection mode" },
				{ keys: ["ButtonA"], text: "Click on marker" },
				{ keys: ["ButtonX"], text: "Cancel selection" },
				{ keys: ["ButtonB"], text: "Unequip" },
			],
		};
	}
}

//

export const WireToolTests = {
	connectThrough1() {
		const wireParent = new Instance("ViewportFrame");
		const plot = new Instance("Folder") as PlotModel;
		const newinstance = () => Markers.Marker.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Model") as BlockModel,
		});

		const block1 = newdata(1);
		const block2 = newdata(2);

		const in1 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			},
			plot,
		);
		const in2 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			},
			plot,
		);

		const out1 = new Markers.Output(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block2,
				dataTypes: ["bool"],
				group: undefined,
			},
			plot,
		);

		WireTool.groupMarkers([in1, in2, out1]);

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
		const plot = new Instance("Folder") as PlotModel;
		const newinstance = () => Markers.Marker.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Model") as BlockModel,
		});

		const block1 = newdata(1);
		const block2 = newdata(2);
		const block3 = newdata(3);

		const in1 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			},
			plot,
		);
		const in2 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			},
			plot,
		);
		const in3 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block3,
				dataTypes: ["bool", "number"],
				group: "1",
			},
			plot,
		);
		const in4 = new Markers.Input(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block3,
				dataTypes: ["bool", "number"],
				group: "1",
			},
			plot,
		);

		const out1 = new Markers.Output(
			newinstance(),
			{
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block2,
				dataTypes: ["bool"],
				group: undefined,
			},
			plot,
		);

		WireTool.groupMarkers([in1, in2, in3, in4, out1]);

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
