import { GamepadService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry, { BlockConfigRegistryNonGeneric } from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import { PlacedBlockData } from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";

type MarkerData = {
	readonly id: BlockConnectionName;
	readonly blockData: PlacedBlockData;
	readonly dataType: keyof BlockConfigDefinitionRegistry;
	readonly markerType: "input" | "connected_input" | "output";
	readonly color: Color3;
	readonly name: string;
};

type Marker = MarkerData & { readonly instance: BillboardGui & { Adornee: BlockModel } };

/** A tool for wiring */
export default class WireTool extends ToolBase {
	private static readonly typeGroups = {
		number: {
			color: Color3.fromRGB(81, 202, 21),
		},
		bool: {
			color: Color3.fromRGB(255, 170, 0),
		},
	} as const;

	private static readonly groups = {
		bool: "bool",
		key: "bool",
		keybool: "bool",
		number: "number",
		clampedNumber: "number",
		motorRotationSpeed: "number",
		thrust: "number",
	} as const satisfies Record<keyof BlockConfigDefinitionRegistry, keyof typeof this.typeGroups>;

	private renderedWires: BasePart[] = [];
	private renderedMarkers: Marker[] = [];
	private renderedTooltips: BillboardGui[] = [];

	private draggingWire: BasePart | undefined;
	private hoverMarker: Marker | undefined;
	public startMarker = new ObservableValue<Marker | undefined>(undefined);

	private readonly viewportFrame;

	constructor(mode: BuildingMode) {
		super(mode);

		// Wire rendering
		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = GuiController.getGameUI();
		this.viewportFrame.Ambient = Color3.fromRGB(255, 255, 255);
		this.viewportFrame.LightColor = Color3.fromRGB(255, 255, 255);
	}

	getDisplayName(): string {
		return "Wire Tool";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895880948";
	}

	getShortDescription(): string {
		return "Connecting blocks";
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
		const averageSize = (part.Size.X + part.Size.Y + part.Size.Z) / 3;
		const halfSize = averageSize / 2;
		const order = [
			new Vector3(halfSize, 0, 0),
			new Vector3(-halfSize, 0, 0),
			new Vector3(0, 0, halfSize),
			new Vector3(0, 0, -halfSize),
			new Vector3(0, halfSize, 0),
			new Vector3(0, -halfSize, 0),
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
				outputBlock: this.startMarker.get()!.blockData.instance,
				outputConnection: this.startMarker.get()!.id,
				inputBlock: this.hoverMarker.blockData.instance,
				inputConnection: this.hoverMarker.id,
			});
			this.updateVisual();
		}

		this.stopDragging();
	}

	protected prepare(): void {
		this.updateVisual(false);
		super.prepare();
	}

	protected prepareTouch(): void {
		this.renderedMarkers.forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			// Always show tooltips
			this.createTooltip(marker);

			if (marker.markerType === "output") {
				this.eventHandler.subscribe(button.MouseButton1Click, () => {
					if (this.startMarker.get()) return;

					this.startMarker.set(marker);
				});
			} else if (marker.markerType === "input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (!this.startMarker.get()) return;

					if (this.canConnect(marker, this.startMarker.get()!)) {
						this.hoverMarker = marker;
						this.finishDragging();
					}
				});
			} else if (marker.markerType === "connected_input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (this.startMarker.get()) return;

					await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
						operation: "disconnect",
						inputBlock: marker.blockData.instance,
						inputConnection: marker.id,
					});
					this.updateVisual();
				});
			}
		});
	}

	private canConnect(marker1: Marker, marker2: Marker) {
		return (
			marker1 &&
			marker1.markerType === "input" &&
			WireTool.groups[marker1.dataType] === WireTool.groups[marker2.dataType] &&
			marker1.blockData !== marker2.blockData
		);
	}

	protected prepareDesktop(): void {
		this.renderedMarkers.forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			// Show tooltip on hover
			this.eventHandler.subscribe(button.MouseEnter, () => {
				const gui = this.createTooltip(marker);
				this.eventHandler.subscribeOnce(button.MouseLeave, () => {
					gui.Destroy();
				});
			});

			if (marker.markerType === "output") {
				this.eventHandler.subscribe(button.MouseButton1Down, () => {
					if (this.startMarker.get()) return;

					this.startMarker.set(marker);
				});
			} else if (marker.markerType === "connected_input") {
				this.eventHandler.subscribe(button.MouseButton1Click, async () => {
					if (this.startMarker.get()) return;

					await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
						operation: "disconnect",
						inputBlock: marker.blockData.instance,
						inputConnection: marker.id,
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
		this.inputHandler.onMouseButton1Up(() => {
			if (!this.startMarker.get()) return;
			this.finishDragging();
		});

		const updateWire = () => {
			const marker = this.startMarker.get();
			if (!marker) return;

			// Get absolute position of marker
			const startPosition = this.getMarkerAbsolutePosition(marker);

			// Create new wire
			if (!this.draggingWire) {
				this.draggingWire = this.createWire(startPosition, startPosition, marker.color);
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
		this.inputHandler.onKeyDown(Enum.KeyCode.ButtonY, () => {
			if (GamepadService.GamepadCursorEnabled) {
				GamepadService.DisableGamepadCursor();
			} else {
				GamepadService.EnableGamepadCursor(undefined);
			}
		});

		// Cancel
		this.inputHandler.onKeyDown(Enum.KeyCode.ButtonX, () => {
			this.startMarker.set(undefined);
		});

		// It works
		this.prepareTouch();
	}

	/** Creates text above the marker with a dot signature with its name */
	private createTooltip(marker: Marker) {
		const gui = ReplicatedStorage.Assets.Wires.WireInfo.Clone();
		gui.TextLabel.Text = marker.name;
		gui.TextLabel.TextColor3 = marker.color;
		gui.StudsOffsetWorldSpace = marker.instance.StudsOffsetWorldSpace.add(new Vector3(0, 1, 0));
		gui.Adornee = marker.instance.Adornee;
		gui.Parent = marker.instance.Parent;

		if (InputController.inputType.get() === "Gamepad") {
			gui.Size = new UDim2(
				gui.Size.X.Scale * 1.5,
				gui.Size.X.Offset * 1.5,
				gui.Size.Y.Scale * 1.5,
				gui.Size.Y.Offset * 1.5,
			);
		}

		this.renderedTooltips.push(gui);

		return gui;
	}

	private createMarker(part: BasePart, markerData: MarkerData, offset: Vector3 = Vector3.zero): Marker {
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
		markerInstance.Parent = GuiController.getGameUI();
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
				button.BackgroundColor3 = markerData.color;
			}
		});

		PartUtils.applyToAllDescendantsOfType("Frame", markerInstance, (button) => {
			if (button.BackgroundColor3 === Color3.fromRGB(255, 0, 255)) {
				button.Name = markerData.name;
				button.BackgroundColor3 = markerData.color;
			}
		});

		const marker = {
			...markerData,
			instance: markerInstance,
		} as Marker;

		this.renderedMarkers.push(marker);

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

		wire.Material = Enum.Material.SmoothPlastic;
		wire.Transparency = 0.1;
		wire.Color = color;
		wire.Shape = Enum.PartType.Cylinder;

		wire.Parent = this.viewportFrame;

		this.updateWire(wire, firstPoint, secondPoint);

		this.renderedWires.push(wire);

		return wire;
	}

	private updateWire(wire: BasePart, firstPoint: Vector3, secondPoint: Vector3) {
		const distance = secondPoint.sub(firstPoint).Magnitude;
		wire.Size = new Vector3(distance - 0.4, 0.1, 0.1);
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
		this.renderedMarkers.forEach((element) => {
			element.instance.Destroy();
		});
		this.renderedMarkers.clear();
	}

	private clearTooltips() {
		this.renderedTooltips.forEach((element) => {
			element.Destroy();
		});
		this.renderedTooltips.clear();
	}

	public enable(): void {
		this.updateVisual();
		super.enable();
	}

	private getMarkerAbsolutePosition(marker: Marker): Vector3 {
		return marker.blockData.instance.GetPivot().PointToWorldSpace(marker.instance.StudsOffsetWorldSpace);
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

	private createPlotWires(plot: PlotModel) {
		const blocks = SharedPlots.getPlotBlockDatas(plot);

		for (const block of blocks) {
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[block.id];
			if (!configDef) continue;

			const markers: MarkerData[] = [];
			for (const markerType of ["output", "input"] as const) {
				for (const [key, config] of Objects.entries(configDef[markerType])) {
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
						color: WireTool.typeGroups[WireTool.groups[config.type]].color,
						name: config.displayName,
					};

					markers.push(marker);
				}
			}

			this.createMarkers(block.instance.PrimaryPart!, markers);
		}

		for (const block of blocks) {
			for (const [connector, connection] of Objects.entries(block.connections)) {
				const input = this.renderedMarkers.find((m) => m.blockData.uuid === block.uuid && m.id === connector)!;
				const output = this.renderedMarkers.find(
					(m) => m.blockData.uuid === connection.blockUuid && m.id === connection.connectionName,
				)!;

				this.createWire(
					this.getMarkerAbsolutePosition(output),
					this.getMarkerAbsolutePosition(input),
					input?.color,
				);
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
