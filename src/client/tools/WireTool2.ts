import { GamepadService, Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientComponentBase } from "client/component/ClientComponentBase";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { Assert } from "client/test/Assert";
import ToolBase from "client/tools/ToolBase";
import Remotes from "shared/Remotes";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
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

const looped = new Map<Markers.Marker | WireComponent, () => void>();
spawn(() => {
	while (true as boolean) {
		task.wait(0.5);

		for (const [_, value] of looped) {
			value();
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
	export abstract class Marker extends ClientComponent<MarkerComponentDefinition> {
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

			markerInstance.MaxDistance = 200;
			markerInstance.Adornee = origin;
			markerInstance.StudsOffsetWorldSpace = origin.CFrame.PointToObjectSpace(
				origin.CFrame.PointToWorldSpace(offset),
			);

			return markerInstance;
		}

		readonly instance;
		readonly data;
		readonly position;
		readonly availableTypes;
		sameGroupMarkers?: readonly Marker[];
		protected pauseColors = false;

		constructor(instance: MarkerComponentDefinition, data: MarkerData) {
			super(instance);

			this.onEnable(() => (this.instance.Enabled = true));
			this.onDisable(() => (this.instance.Enabled = false));

			this.instance = instance;
			this.data = data;
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

				control.getGui().AnchorPoint = new Vector2(0.5, 0.5); // can't set Y to 1 because then it doesn't render
				control.getGui().Position = new UDim2(0.5, 0, 0.5, 0);
				control.getGui().Size = new UDim2(1, 0, 1, 0);

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
					// TODO:::
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
			this.event.subscribeObservable2(
				this.availableTypes,
				(types) => {
					loop?.();
					const setcolor = (color: Color3) => {
						this.instance.TextButton.BackgroundColor3 = color;
						this.instance.TextButton.Filled.BackgroundColor3 = color;

						/*
					const nametext = nameParent.get();
					if (nametext) {
						nametext.getGui().TextColor3 = color;
					}
					*/
					};

					if (types.size() === 1) {
						setcolor(typeGroups[types[0]].color);
					} else {
						let i = 0;
						const func = () => {
							if (this.pauseColors) return;
							setcolor(typeGroups[types[(i = (i + 1) % types.size())]].color);
						};

						looped.set(this, func);
						loop = () => looped.delete(this);
					}
				},
				true,
			);
		}

		narrowDownTypesSelfAndOther(): void {
			const grouped = this.getFullSameGroupTree();
			const types = intersectTypes(Arrays.mapSet(grouped, (m) => m.availableTypes.get()));

			this.availableTypes.set(types);
			for (const marker of grouped) {
				marker.availableTypes.set(types);
			}
		}
		widenTypesSelfAndOther(): void {
			const grouped = this.getFullSameGroupTree();
			const types = intersectTypes(Arrays.mapSet(grouped, (m) => m.data.dataTypes));

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

		constructor(gui: MarkerComponentDefinition, data: MarkerData) {
			super(gui, data);

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
			return new Set(Arrays.map(this.connected, (k) => k));
		}
	}
}

type WireComponentDefinition = Part;
class WireComponent extends ClientComponent<WireComponentDefinition> {
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
		this.event.subscribeObservable(
			this.types,
			(types) => {
				loop?.();
				const setcolor = (color: Color3) => (this.instance.Color = color);

				if (types.size() === 1) {
					setcolor(typeGroups[types[0]].color);
				} else {
					let i = 0;
					const func = () =>
						setcolor(
							typeGroups[types[(i = (i + 1) % (types.size() === 0 ? 1 : types.size()))]]?.color ??
								Colors.red,
						);

					looped.set(this, func);
					loop = () => looped.delete(this);
				}
			},
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
		from.connect(to, wireParent);

		spawn(async () => {
			const result = await Remotes.Client.GetNamespace("Building").Get("LogicConnect").CallServerAsync({
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

	export class Desktop extends ClientComponentBase {
		constructor(markers: readonly Markers.Marker[], wireParent: ViewportFrame) {
			class WireMover extends ClientComponent<WireComponentDefinition> {
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
				}
			}

			super();

			const currentMoverContainer = new ComponentChild<WireMover>(this);
			let hoverMarker: Markers.Input | undefined;

			for (const marker of markers) {
				if (marker instanceof Markers.Input) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						disconnectMarker(marker);
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
	}
	export class Touch extends ComponentBase {
		constructor(markers: readonly Markers.Marker[], wireParent: ViewportFrame) {
			super();

			let startMarker: Markers.Output | undefined;
			const set = (marker: Markers.Output) => {
				startMarker = marker;
				marker.highlight();
				hideNonConnectableMarkers(marker, markers);
			};
			const unset = (destroying = false) => {
				if (startMarker?.isDestroyed()) return;
				startMarker?.unhighlight();
				startMarker = undefined;

				if (!destroying) {
					showAllMarkers(markers);
				}
			};

			this.onDisable(() => unset(true));

			for (const marker of markers) {
				if (marker instanceof Markers.Input) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						if (!startMarker) {
							disconnectMarker(marker);
							return;
						}

						connectMarkers(startMarker, marker, wireParent);
						unset();
					});
				} else if (marker instanceof Markers.Output) {
					this.event.subscribe(marker.instance.TextButton.Activated, () => {
						if (startMarker) unset();
						else set(marker);
					});
				}
			}
		}
	}
	export class Gamepad extends Desktop {
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
export default class WireTool2 extends ToolBase {
	readonly markerParent;
	readonly wireParent;
	private readonly markers = this.parent(new ComponentKeyedChildren<string, Markers.Marker>(this, true));

	constructor(mode: BuildingMode) {
		super(mode);

		this.markerParent = Element.create("ScreenGui", {
			Name: "WireToolMarkers",
			ScreenInsets: Enum.ScreenInsets.None,
			IgnoreGuiInset: true,
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
			const cic = new ComponentChild(this, true);
			this.event.onPrepareDesktop(() =>
				cic.set(
					new Controllers.Desktop(
						[...this.markers.getAll()].map((e) => e[1]),
						this.wireParent,
					),
				),
			);
			this.event.onPrepareTouch(() =>
				cic.set(
					new Controllers.Touch(
						[...this.markers.getAll()].map((e) => e[1]),
						this.wireParent,
					),
				),
			);
		}
	}

	static groupMarkers(markers: readonly Markers.Marker[]) {
		const groupedMarkers = Arrays.groupBy(markers, (m) => m.data.group + " " + m.data.blockData.uuid);
		for (const marker of markers) {
			if (marker.data.group === undefined) continue;
			marker.sameGroupMarkers = groupedMarkers.get(marker.data.group + " " + marker.data.blockData.uuid);
		}
	}

	private createEverything() {
		this.createEverythingOnPlot(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
	}
	private createEverythingOnPlot(plot: PlotModel) {
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
						id: key as BlockConnectionName,
						name: config.displayName,
					};

					const markerInstance = Markers.Marker.createInstance(block.instance.PrimaryPart!, index++);
					const marker =
						markerType === "input"
							? new Markers.Input(markerInstance, data)
							: new Markers.Output(markerInstance, data);

					marker.instance.Parent = this.markerParent;
					this.markers.add(block.uuid + key, marker);
				}
			}
		}

		WireTool2.groupMarkers(Arrays.map(this.markers.getAll(), (k, v) => v));

		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
			for (const [connectionName, connection] of Objects.entries(block.connections)) {
				const from = this.markers.get(block.uuid + connectionName) as Markers.Input;
				const to = this.markers.get(connection.blockUuid + connection.connectionName) as Markers.Output;

				to.connect(from, this.wireParent);
			}
		}
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
}

//

export const WireToolTests = {
	connectThrough1() {
		const wireParent = new Instance("ViewportFrame");
		const newinstance = () => Markers.Marker.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Model") as BlockModel,
		});

		const block1 = newdata(1);
		const block2 = newdata(2);

		const in1 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in2 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});

		const out1 = new Markers.Output(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
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
		const newinstance = () => Markers.Marker.createInstance(new Instance("Part"), 0);
		const newdata = (uuid: string | number) => ({
			uuid: tostring(uuid) as BlockUuid,
			instance: new Instance("Model") as BlockModel,
		});

		const block1 = newdata(1);
		const block2 = newdata(2);
		const block3 = newdata(3);

		const in1 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in2 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block1,
			dataTypes: ["bool", "number"],
			group: "0",
		});
		const in3 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block3,
			dataTypes: ["bool", "number"],
			group: "1",
		});
		const in4 = new Markers.Input(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
			blockData: block3,
			dataTypes: ["bool", "number"],
			group: "1",
		});

		const out1 = new Markers.Output(newinstance(), {
			id: "a" as BlockConnectionName,
			name: "u",
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
