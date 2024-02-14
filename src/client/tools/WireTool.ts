import { GamepadService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponentContainer } from "client/component/ClientComponentContainer";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import Remotes from "shared/Remotes";
import blockConfigRegistry, { BlockConfigRegistryNonGeneric } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import SharedComponent from "shared/component/SharedComponent";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import PartUtils from "shared/utils/PartUtils";

type MarkerData = {
	readonly id: BlockConnectionName;
	readonly blockData: PlacedBlockData;
	readonly dataType: keyof BlockConfigTypes.Types;
	readonly markerType: "input" | "connected_input" | "output";
	readonly colors: readonly Color3[];
	readonly name: string;
};

type MarkerComponentDefinition = BillboardGui;
class MarkerComponent extends SharedComponent<MarkerComponentDefinition> {
	readonly instance;
	readonly data;
	private tooltip?: BillboardGui;

	constructor(gui: MarkerComponentDefinition, data: MarkerData) {
		super(gui);

		this.instance = gui;
		this.data = data;

		if (this.data.colors.size() > 1) {
			const button = this.instance.FindFirstChildWhichIsA("TextButton") as TextButton;
			let i = 0;
			spawn(() => {
				const tru = true;
				while (tru) {
					task.wait(1);
					button.BackgroundColor3 = this.data.colors[(i = (i + 1) % this.data.colors.size())];
				}
			});
		}
	}

	protected prepareDesktop() {
		this.tooltip?.Destroy();
		const button = this.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

		// Show tooltip on hover
		this.eventHandler.subscribe(button.MouseEnter, () => {
			this.tooltip = this.createTooltip();
			this.eventHandler.subscribeOnce(button.MouseLeave, () => {
				this.clear();
				this.tooltip = undefined;
			});
		});
	}

	protected prepareTouch() {
		// Always show the tooltip
		this.createTooltip();
	}

	/** Creates text above the marker with a dot signature with its name */
	private createTooltip() {
		this.tooltip?.Destroy();
		this.tooltip = undefined;

		const gui = ReplicatedStorage.Assets.Wires.WireInfo.Clone();
		gui.TextLabel.Text = this.data.name;
		gui.TextLabel.TextColor3 = this.data.colors[0];
		gui.StudsOffsetWorldSpace = this.instance.StudsOffsetWorldSpace.add(new Vector3(0, 1, 0));
		gui.Adornee = this.instance.Adornee;
		gui.Parent = this.instance.Parent;
		this.add(new SharedComponent(gui));

		if (InputController.inputType.get() === "Gamepad") {
			gui.Size = new UDim2(
				gui.Size.X.Scale * 1.5,
				gui.Size.X.Offset * 1.5,
				gui.Size.Y.Scale * 1.5,
				gui.Size.Y.Offset * 1.5,
			);
		}

		return gui;
	}
}

/** A tool for wiring */
export default class WireTool extends ToolBase {
	private static readonly typeGroups = {
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

	private static readonly groups = {
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
	} as const satisfies Record<keyof BlockConfigTypes.Types, keyof typeof this.typeGroups>;

	private renderedWires: BasePart[] = [];
	private renderedTooltips: BillboardGui[] = [];

	private draggingWire: BasePart | undefined;
	private hoverMarker: MarkerComponent | undefined;
	public startMarker = new ObservableValue<MarkerComponent | undefined>(undefined);

	private readonly viewportFrame;

	private readonly markers;

	constructor(mode: BuildingMode) {
		super(mode);

		this.markers = this.add(new ClientComponentContainer<MarkerComponent>());
		this.event.onEnable(() => this.markers.enable());
		this.event.onDisable(() => this.markers.disable());

		// Wire rendering
		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = Gui.getGameUI();
		this.viewportFrame.Ambient = Colors.white;
		this.viewportFrame.LightColor = Colors.white;
		this.viewportFrame.ZIndex = -1000;
	}

	getDisplayName(): string {
		return "Wire";
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
		return []; // todo
	}

	private createMarkers(part: BasePart, markers: readonly MarkerData[]) {
		// TODO: this fixes error if this tries to create a wire to a destroyed block of an OTHER player in ride mode
		if (!part) return;

		const averageSize = (part.Size.X + part.Size.Y + part.Size.Z) / 3;
		const halfSize = averageSize / 2;
		const offset = 0.25;
		const order = [
			new Vector3(-halfSize + offset, 0, 0),
			new Vector3(halfSize - offset, 0, 0),
			new Vector3(0, 0, -halfSize + offset),
			new Vector3(0, 0, halfSize - offset),
			new Vector3(0, -halfSize + offset, 0),
			new Vector3(0, halfSize - offset, 0),
			new Vector3(0, 0, 0),
		];

		if (markers.size() === 1) {
			this.createMarker(part, markers[0], Vector3.zero);
			return;
		}

		for (let i = 0; i < markers.size(); i++) {
			this.createMarker(part, markers[i], order[i]);
		}
	}

	public stopDragging() {
		GamepadService.DisableGamepadCursor();
		this.draggingWire?.Destroy();
		this.draggingWire = undefined;
		this.hoverMarker = undefined;
		this.startMarker.set(undefined);
	}

	public async finishDragging() {
		if (!this.startMarker.get()) return;

		if (this.hoverMarker) {
			await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
				operation: "connect",
				outputBlock: this.startMarker.get()!.data.blockData.instance,
				outputConnection: this.startMarker.get()!.data.id,
				inputBlock: this.hoverMarker.data.blockData.instance,
				inputConnection: this.hoverMarker.data.id,
			});
			this.updateVisual();
		}

		this.stopDragging();
	}

	protected prepareTouch(): void {
		this.markers.getChildren().forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			if (marker.data.markerType === "output") {
				this.eventHandler.subscribe(button.MouseButton1Click, () => {
					if (this.startMarker.get()) return;

					this.startMarker.set(marker);
				});
			} else if (marker.data.markerType === "input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (!this.startMarker.get()) return;

					if (this.canConnect(marker, this.startMarker.get()!)) {
						this.hoverMarker = marker;
						this.finishDragging();
					}
				});
			} else if (marker.data.markerType === "connected_input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (this.startMarker.get()) return;

					await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
						operation: "disconnect",
						inputBlock: marker.data.blockData.instance,
						inputConnection: marker.data.id,
					});
					this.updateVisual();
				});
			}
		});
	}

	private canConnect(marker1: MarkerComponent | undefined, marker2: MarkerComponent) {
		if (!marker1 || marker1.data.markerType !== "input") {
			return false;
		}

		const type1 = this.getAllowedTypes(
			marker1.data.blockData,
			SharedPlots.getPlotBlockDatas(SharedPlots.getPlotByBlock(marker1.data.blockData.instance)!),
			marker1.data.id,
			(blockConfigRegistry as BlockConfigRegistryNonGeneric)[marker1.data.blockData.id]!.input[marker1.data.id],
		).map((t) => WireTool.groups[t]);
		const type2 = this.getAllowedTypes(
			marker2.data.blockData,
			SharedPlots.getPlotBlockDatas(SharedPlots.getPlotByBlock(marker2.data.blockData.instance)!),
			marker2.data.id,
			(blockConfigRegistry as BlockConfigRegistryNonGeneric)[marker2.data.blockData.id]!.output[marker2.data.id],
		).map((t) => WireTool.groups[t]);

		if (type1.find((t) => type2.includes(t))) {
			return true;
		}

		return (
			WireTool.groups[marker1.data.dataType] === WireTool.groups[marker2.data.dataType] &&
			marker1.data.blockData !== marker2.data.blockData
		);
	}

	protected prepareDesktop(): void {
		this.markers.getChildren().forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			if (marker.data.markerType === "output") {
				this.eventHandler.subscribe(button.MouseButton1Down, () => {
					if (this.startMarker.get()) return;

					this.startMarker.set(marker);
				});
			} else if (marker.data.markerType === "connected_input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (this.startMarker.get()) return;

					await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
						operation: "disconnect",
						inputBlock: marker.data.blockData.instance,
						inputConnection: marker.data.id,
					});
					this.updateVisual();
				});
			}

			// Get marker on hover
			this.eventHandler.subscribe(button.MouseEnter, () => {
				if (!this.startMarker.get()) return;

				if (this.canConnect(marker, this.startMarker.get()!)) {
					this.hoverMarker = marker;
				}
			});
			this.eventHandler.subscribe(button.MouseLeave, () => {
				if (!this.startMarker.get()) return;

				if (this.hoverMarker === marker) {
					this.hoverMarker = undefined;
				}
			});
		});

		// Dragging end
		this.inputHandler.onMouse1Up(() => {
			if (!this.startMarker.get()) return;
			this.finishDragging();
		}, true);

		const updateWire = () => {
			const marker = this.startMarker.get();
			if (!marker) return;

			// Get absolute position of marker
			const startPosition = this.getMarkerAbsolutePosition(marker);

			// Create new wire
			if (!this.draggingWire) {
				this.draggingWire = this.createWire(startPosition, startPosition, marker.data.colors[0]);
			}

			// Get position of hover marker / mouse hit
			const endPosition = this.hoverMarker
				? this.getMarkerAbsolutePosition(this.hoverMarker)
				: this.mouse.Hit.Position;

			this.updateWire(this.draggingWire, startPosition, endPosition);
		};

		// Update wire on movement
		this.eventHandler.subscribe(this.mouse.Move, updateWire);
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, updateWire);
	}

	protected prepareGamepad(): void {
		// Selection mode
		this.inputHandler.onKeyDown("ButtonY", () => {
			if (GamepadService.GamepadCursorEnabled) {
				GamepadService.DisableGamepadCursor();
			} else {
				GamepadService.EnableGamepadCursor(undefined);
			}
		});

		// Cancel
		this.inputHandler.onKeyDown("ButtonX", () => {
			this.startMarker.set(undefined);
		});

		// It works
		this.prepareTouch();
	}

	protected prepare() {
		this.updateVisual(false);
		super.prepare();
	}

	private createMarker(part: BasePart, markerData: MarkerData, offset: Vector3 = Vector3.zero): MarkerComponent {
		let markerInstance;

		if (markerData.markerType === "output") {
			markerInstance = ReplicatedStorage.Assets.Wires.WireMarkerOutput.Clone();
		} else if (markerData.markerType === "connected_input") {
			markerInstance = ReplicatedStorage.Assets.Wires.WireMarkerInputConnected.Clone();
		} else if (markerData.markerType === "input") {
			markerInstance = ReplicatedStorage.Assets.Wires.WireMarkerInput.Clone();
		} else {
			throw "No marker";
		}

		markerInstance.Adornee = part;
		markerInstance.Parent = Gui.getGameUI();
		markerInstance.StudsOffsetWorldSpace = part.CFrame.PointToObjectSpace(part.CFrame.PointToWorldSpace(offset));

		if (InputController.inputType.get() === "Gamepad") {
			markerInstance.Size = new UDim2(
				markerInstance.Size.X.Scale * 1.5,
				markerInstance.Size.X.Offset * 1.5,
				markerInstance.Size.Y.Scale * 1.5,
				markerInstance.Size.Y.Offset * 1.5,
			);
		}

		PartUtils.applyToAllDescendantsOfType("TextButton", markerInstance, (button) => {
			if (button.BackgroundColor3 === Color3.fromRGB(255, 0, 255)) {
				button.Name = markerData.name;
				button.BackgroundColor3 = markerData.colors[0];
			}
		});

		PartUtils.applyToAllDescendantsOfType("Frame", markerInstance, (button) => {
			if (button.BackgroundColor3 === Color3.fromRGB(255, 0, 255)) {
				button.Name = markerData.name;
				button.BackgroundColor3 = markerData.colors[0];
			}
		});

		const marker = new MarkerComponent(markerInstance, markerData);
		this.markers.add(marker);

		return marker;
	}

	/**
	 * Creates a wire that is highlighted and that is on top of all objects. It is not deleted until the cleanup is called
	 * @param firstPoint The origin vector
	 * @param secondPoint The end vector
	 * @param color Wire color
	 */
	private createWire(
		firstPoint: Vector3,
		secondPoint: Vector3,
		color: Color3 = Color3.fromRGB(255, 0, 255),
	): BasePart {
		const wire = new Instance("Part");
		wire.Anchored = true;
		wire.CanCollide = false;
		wire.CanQuery = false;
		wire.CanTouch = false;
		wire.CastShadow = false;

		wire.Material = Enum.Material.Neon;
		wire.Transparency = 0.4;
		wire.Color = color;
		wire.Shape = Enum.PartType.Cylinder;

		wire.Parent = this.viewportFrame;

		this.updateWire(wire, firstPoint, secondPoint);

		this.renderedWires.push(wire);

		return wire;
	}

	private updateWire(wire: BasePart, firstPoint: Vector3, secondPoint: Vector3) {
		const distance = secondPoint.sub(firstPoint).Magnitude;
		wire.Size = new Vector3(distance - 0.4, 0.15, 0.15);
		wire.CFrame = new CFrame(firstPoint, secondPoint)
			.mul(new CFrame(0, 0, -distance / 2))
			.mul(CFrame.Angles(0, math.rad(90), 0));
	}

	private clearWires() {
		this.renderedWires.forEach((element) => {
			element.Destroy();
		});
		this.renderedWires.clear();
	}

	private clearMarkers() {
		this.markers.clear();
	}

	private clearTooltips() {
		this.renderedTooltips.forEach((element) => {
			element.Destroy();
		});
		this.renderedTooltips.clear();
	}

	private getMarkerAbsolutePosition(marker: MarkerComponent): Vector3 {
		return marker.data.blockData.instance.GetPivot().PointToWorldSpace(marker.instance.StudsOffsetWorldSpace);
	}

	private updateVisual(prepare: boolean = true) {
		// Cleanup
		this.clearWires();
		this.clearMarkers();
		this.clearTooltips();
		this.stopDragging();

		for (const plot of SharedPlots.getAllowedPlots(Players.LocalPlayer)) {
			this.createPlotWires(plot);
		}

		if (prepare) {
			this.prepare();
		}
	}

	private getConnectedTo(
		block: PlacedBlockData,
		blocks: readonly PlacedBlockData[],
		key: BlockConnectionName,
		config: BlockConfigTypes.Definition,
	): keyof BlockConfigTypes.Types | undefined {
		if (config.type !== "or") return config.type;

		const connectedTo = block.connections[key as BlockConnectionName];
		if (connectedTo) {
			const connectedToBlock = blocks.find((b) => b.uuid === connectedTo.blockUuid);

			if (connectedToBlock) {
				const a = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[connectedToBlock.id]?.output[
					connectedTo.connectionName
				];

				if (a) return a.type;
			}
		}
	}

	private getAllowedTypes(
		block: PlacedBlockData,
		blocks: readonly PlacedBlockData[],
		key: BlockConnectionName,
		config: BlockConfigTypes.Definition,
	): readonly (keyof BlockConfigTypes.Types)[] {
		if (config.type !== "or") return [config.type];

		const connected = this.getConnectedTo(block, blocks, key, config);
		if (connected !== undefined) return [connected];

		if (config.group !== undefined) {
			for (const [samekey, same] of Objects.pairs(block.connections)) {
				if (key === samekey) continue;
				for (const [k, a] of Objects.pairs(
					(blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id]!.input,
				)) {
					if (a.type !== "or") continue;
					if (a.group !== config.group) continue;

					const pos = this.getConnectedTo(block, blocks, k as BlockConnectionName, a);
					if (pos !== undefined) return [pos];
				}
			}
		}

		return config.types.map((t) => t.type);
	}

	private createPlotWires(plot: PlotModel) {
		const blocks = SharedPlots.getPlotBlockDatas(plot);

		for (const block of blocks) {
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id];
			if (!configDef) continue;

			const markers: MarkerData[] = [];
			for (const markerType of ["output", "input"] as const) {
				for (const [key, config] of Objects.pairs(configDef[markerType])) {
					if (config.connectorHidden) continue;

					const allowed = this.getAllowedTypes(block, blocks, key as BlockConnectionName, config);
					const marker: MarkerData = {
						id: key as BlockConnectionName,
						blockData: block,
						markerType:
							markerType === "input" &&
							blocks.find(
								(b) =>
									key in block.connections &&
									block.connections[key as keyof typeof b.connections].blockUuid === b.uuid,
							)
								? "connected_input"
								: markerType,
						dataType: config.type,
						colors: allowed.map((a) => WireTool.typeGroups[WireTool.groups[a]].color),
						name: config.displayName,
					};

					markers.push(marker);
				}
			}

			this.createMarkers(block.instance.PrimaryPart!, markers);
			//if (math.random(1, 2) === 1) task.wait();

			if (!this.isEnabled()) return;
		}

		// Wires
		for (const block of blocks) {
			for (const [connector, connection] of Objects.pairs(block.connections)) {
				const input = this.markers
					.getChildren()
					.find((m) => m.data.blockData.uuid === block.uuid && m.data.id === connector)!;
				const output = this.markers
					.getChildren()
					.find(
						(m) =>
							m.data.blockData.uuid === connection.blockUuid && m.data.id === connection.connectionName,
					)!;

				this.createWire(
					this.getMarkerAbsolutePosition(output),
					this.getMarkerAbsolutePosition(input),
					input?.data.colors[0],
				);

				//if (math.random(1, 2) === 1) task.wait();
			}
		}
	}

	public disable(): void {
		super.disable();
		this.stopDragging();

		// Cleanup
		this.clearWires();
		this.clearMarkers();
		this.clearTooltips();

		GamepadService.DisableGamepadCursor();
	}
}
