import { GamepadService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import blockConfigRegistry, { BlockConfigRegistryNonGeneric } from "shared/BlockConfigRegistry";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";

type MarkerData = {
	readonly id: BlockConnectionName;
	readonly block: BlockModel;
	readonly dataType: keyof ConfigDefinitionType;
	readonly markerType: "input" | "connected_input" | "output";
	readonly color: Color3;
	readonly name: string;
};

type Marker = MarkerData & { readonly instance: BillboardGui & { Adornee: BlockModel } };

/** A tool for wiring */
export default class WireTool extends ToolBase {
	private static readonly colors: Readonly<Record<ConfigValueType, Color3>> = {
		bool: Color3.fromRGB(170, 255, 0),
		number: Color3.fromRGB(24, 255, 247),
		key: new Color3(1, 1, 1), // useless
	};

	private renderedWires: BasePart[] = [];
	private renderedMarkers: Marker[] = [];
	private renderedTooltips: BillboardGui[] = [];

	private draggingWire: BasePart | undefined;
	private possibleDraggingEnd: Marker | undefined;
	public draggingStartMarker = new ObservableValue<Marker | undefined>(undefined);

	private readonly viewportFrame;

	constructor(mode: BuildingMode) {
		super(mode);

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
		keys.push({ key: Enum.KeyCode.ButtonX, text: "Click on marker" });
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

		for (let i = 0; i < markers.size(); i++) {
			this.createMarker(part, markers[i], order[i]);
		}
	}

	public stop() {
		this.draggingWire?.Destroy();
		this.draggingWire = undefined;
		this.possibleDraggingEnd = undefined;
		this.draggingStartMarker.set(undefined);
	}

	public async stopDragging() {
		if (!this.draggingStartMarker.get()) return;

		if (this.possibleDraggingEnd) {
			await Remotes.Client.GetNamespace("Building").Get("UpdateLogicConnectionRequest").CallServerAsync({
				operation: "connect",
				fromBlock: this.draggingStartMarker.get()!.block,
				fromConnection: this.draggingStartMarker.get()!.id,
				toBlock: this.possibleDraggingEnd.block,
				toConnection: this.possibleDraggingEnd.id,
			});
			Logger.info("looks like connect");
		} else {
			Logger.info("cancelled");
		}

		this.stop();
	}

	protected prepare(): void {
		this.clearTooltips();
		this.stopDragging();

		super.prepare();
	}

	protected prepareDesktop(): void {
		this.renderedMarkers.forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			// Show tooltip on hover
			this.eventHandler.subscribe(button.MouseEnter, () => {
				const gui = ReplicatedStorage.Assets.Wires.WireInfo.Clone();
				gui.TextLabel.Text = marker.name;
				gui.TextLabel.TextColor3 = marker.color;
				gui.StudsOffsetWorldSpace = marker.instance.StudsOffsetWorldSpace.add(new Vector3(0, 1, 0));
				gui.Adornee = marker.instance.Adornee;
				gui.Parent = marker.instance.Parent;

				this.eventHandler.subscribeOnce(button.MouseLeave, () => {
					gui.Destroy();
				});

				this.renderedTooltips.push(gui);
			});
		});

		this.renderedMarkers.forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			// Dragging start
			if (marker.markerType === "output") {
				this.eventHandler.subscribe(button.MouseButton1Down, () => {
					Logger.info("Dragging started");

					this.draggingStartMarker.set(marker);
				});
			}

			// Dragging end
			this.inputHandler.onMouseButton1Up(() => this.stopDragging());

			// Possible wire detection
			this.eventHandler.subscribe(button.MouseEnter, () => {
				if (!this.draggingStartMarker.get()) return;

				if (
					marker &&
					marker.markerType === "input" &&
					marker.dataType === this.draggingStartMarker.get()!.dataType
				) {
					this.possibleDraggingEnd = marker;
				}
			});
			this.eventHandler.subscribe(button.MouseLeave, () => {
				if (!this.draggingStartMarker.get()) return;

				if (this.possibleDraggingEnd === marker) {
					this.possibleDraggingEnd = undefined;
				}
			});
		});

		const updateWire = () => {
			const marker = this.draggingStartMarker.get();
			if (!marker) return;

			// Get absolute position of marker
			const startPosition = marker.block.GetPivot().Position.add(marker.instance.StudsOffsetWorldSpace);

			// Create new wire
			if (!this.draggingWire) {
				this.draggingWire = this.createWire(startPosition, startPosition, marker.color);
			}

			// Get position of possible end / mouse hit
			const endPosition = this.possibleDraggingEnd
				? this.possibleDraggingEnd.block
						.GetPivot()
						.Position.add(this.possibleDraggingEnd.instance.StudsOffsetWorldSpace)
				: this.mouse.Hit.Position;

			this.updateWire(this.draggingWire, startPosition, endPosition);
		};

		// Update wire on movement
		this.eventHandler.subscribe(this.mouse.Move, updateWire);
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, updateWire);
	}

	protected prepareGamepad(): void {
		this.renderedMarkers.forEach((marker) => {
			const button = marker.instance.FindFirstChildWhichIsA("TextButton") as TextButton;

			// Show tooltips always
			const gui = ReplicatedStorage.Assets.Wires.WireInfo.Clone();
			gui.TextLabel.Text = marker.name;
			gui.TextLabel.TextColor3 = marker.color;
			gui.StudsOffsetWorldSpace = marker.instance.StudsOffsetWorldSpace.add(new Vector3(0, 1, 0));
			gui.Adornee = marker.instance.Adornee;
			gui.Parent = marker.instance.Parent;
			this.renderedTooltips.push(gui);

			// Start marker selection mode
			this.inputHandler.onKeyDown(Enum.KeyCode.ButtonY, () => {
				if (!GamepadService.GamepadCursorEnabled) {
					GamepadService.EnableGamepadCursor(undefined);
				} else {
					GamepadService.DisableGamepadCursor();
				}
			});

			// TODO: Rewrite
			// this.eventHandler.subscribe(button.MouseButton1Down, async () => {
			// 	if (!this.draggingStartMarker.get()) {
			// 		if (marker.markerType === "output") {
			// 			this.draggingStartMarker.set(marker);
			// 		}
			// 	} else {
			// 		if (marker.markerType === "input") {
			// 			await Remotes.Client.GetNamespace("Building")
			// 				.Get("UpdateLogicConnectionRequest")
			// 				.CallServerAsync({
			// 					operation: "connect",
			// 					fromBlock: this.draggingStartMarker.get()!.block,
			// 					fromConnection: this.draggingStartMarker.get()!.id,
			// 					toBlock: marker.block,
			// 					toConnection: marker.id,
			// 				});
			// 			Logger.info("looks like connect");
			// 			this.stop();
			// 		}
			// 		if (marker.markerType === "connected_input" && !this.draggingStartMarker.get()) {
			// 			// TODO: REMOVE WIRE
			// 		}
			// 	}
			// });

			// const updateWire = () => {
			// 	const marker = this.draggingStartMarker.get();
			// 	if (!marker) return;

			// 	const startPosition = marker.block.GetPivot().Position.add(marker.instance.StudsOffsetWorldSpace);

			// 	// Create new wire
			// 	if (!this.draggingWire) {
			// 		this.draggingWire = this.createWire(startPosition, startPosition, marker.color);
			// 	}

			// 	const endPosition = this.possibleDraggingEnd
			// 		? this.possibleDraggingEnd.block
			// 				.GetPivot()
			// 				.Position.add(this.possibleDraggingEnd.instance.StudsOffsetWorldSpace)
			// 		: this.mouse.Hit.Position;

			// 	this.updateWire(this.draggingWire, startPosition, endPosition);
			// };

			// this.eventHandler.subscribe(Signals.CAMERA.MOVED, updateWire);
		});
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
			markerInstance = ReplicatedStorage.Assets.Wires.WireMarkerOutput.Clone();
		}

		markerInstance.Adornee = part;
		markerInstance.Parent = GuiController.getGameUI();
		markerInstance.StudsOffsetWorldSpace = offset;

		PartUtils.applyToAllDescendantsOfType("TextButton", markerInstance, (button) => {
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

		wire.Parent = this.viewportFrame;

		this.updateWire(wire, firstPoint, secondPoint);

		this.renderedWires.push(wire);

		return wire;
	}

	private updateWire(wire: BasePart, firstPoint: Vector3, secondPoint: Vector3) {
		const distance = secondPoint.sub(firstPoint).Magnitude;
		wire.Size = new Vector3(0.1, 0.1, distance - 0.4);
		wire.CFrame = new CFrame(firstPoint, secondPoint).mul(new CFrame(0, 0, -distance / 2));
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
		for (const plot of SharedPlots.getAllowedPlots(Players.LocalPlayer)) {
			this.createPlotWires(plot);
		}
		super.enable();
	}

	private createPlotWires(plot: PlotModel) {
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren(undefined);
		for (const block of blocks) {
			const blockData = BlockManager.getBlockDataByBlockModel(block);
			const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[blockData.id];
			if (!configDef) continue;

			const markers: MarkerData[] = [];
			for (const markerType of ["input", "output"] as const) {
				for (const marker of Objects.entries(configDef[markerType]).map(
					(e): MarkerData => ({
						id: e[0] as BlockConnectionName,
						block: block,
						markerType,
						dataType: e[1].type,
						color: WireTool.colors[e[1].type],
						name: e[1].displayName,
					}),
				)) {
					markers.push(marker);
				}
			}

			this.createMarkers(block.PrimaryPart!, markers);
		}
	}

	public disable(): void {
		super.disable();

		this.clearWires();
		this.clearMarkers();
		this.clearTooltips();

		GamepadService.DisableGamepadCursor();

		this.stopDragging();
	}
}
