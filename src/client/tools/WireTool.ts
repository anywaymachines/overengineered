import { GamepadService, GuiService, Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientInstanceComponent } from "client/component/ClientInstanceComponent";
import { InputController } from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";
import { LogControl } from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import { ActionController } from "client/modes/build/ActionController";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { Element } from "shared/Element";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { BlockWireManager } from "shared/block/BlockWireManager";
import { BlockConfigRegistryNonGeneric, blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { Component } from "shared/component/Component";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentChildren } from "shared/component/ComponentChildren";
import { ObservableValue, ReadonlyObservableValue } from "shared/event/ObservableValue";

type TypeGroup = {
	readonly color: Color3;
};
const typeGroups: { readonly [k in BlockWireManager.DataType]: TypeGroup } = {
	bool: { color: Colors.yellow },
	vector3: { color: Colors.pink },
	number: { color: Colors.green },
	string: { color: Colors.purple },
	color: { color: Colors.red },
	byte: { color: Color3.fromRGB(97, 138, 255) },
	bytearray: { color: Colors.black },
	never: { color: Colors.black },
};

const markerParent = Element.create("ScreenGui", {
	Name: "WireToolMarkers",
	ScreenInsets: Enum.ScreenInsets.None,
	IgnoreGuiInset: true,
	DisplayOrder: -1, // to draw behind the wires
	Parent: Gui.getPlayerGui(),
	ResetOnSpawn: false,
});
const wireParent = Element.create("ViewportFrame", {
	Name: "WireViewportFrame",
	Size: UDim2.fromScale(1, 1),
	CurrentCamera: Workspace.CurrentCamera,
	Transparency: 1,
	Parent: markerParent,
	Ambient: Colors.white,
	LightColor: Colors.white,
	ZIndex: -1,
});

const looped = new Map<Markers.Marker | WireComponent, (index: number) => void>();
task.spawn(() => {
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

		readonly data;
		readonly position;
		readonly availableTypes;
		sameGroupMarkers?: readonly Marker[];
		protected pauseColors = false;

		constructor(
			instance: MarkerComponentDefinition,
			marker: BlockWireManager.Markers.Marker,
			readonly plot: SharedPlot,
		) {
			super(instance);

			this.onEnable(() => (this.instance.Enabled = true));
			this.onDisable(() => (this.instance.Enabled = false));

			this.data = marker.data;
			this.position = this.data.blockData.instance.GetPivot().PointToWorldSpace(instance.StudsOffsetWorldSpace);
			this.availableTypes = marker.availableTypes;

			this.initTooltips();
			this.initColors();
		}

		private initTooltips() {
			const tooltipParent = new ComponentChild<Control<TextLabel>>(this, true);
			const createTooltip = () => {
				const control = new Control(
					ReplicatedAssets.get<{ Wires: { WireInfoLabel: TextLabel } }>().Wires.WireInfoLabel.Clone(),
				);
				control.instance.Text = this.data.name;
				control.instance.Parent = this.instance;
				control.instance.AnchorPoint = new Vector2(0.5, 0.98); // can't set Y to 1 because then it doesn't render
				control.instance.Position = new UDim2(0.5, 0, 0, 0);
				control.instance.Size = new UDim2(2, 0, 1, 0);

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
			this.event.subscribeObservable(
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
	}

	export class Input extends Marker {
		private connected = false;

		constructor(
			gui: MarkerComponentDefinition,
			readonly marker: BlockWireManager.Markers.Input,
			plot: SharedPlot,
			componentMap: ReadonlyMap<BlockWireManager.Markers.Marker, Marker>,
		) {
			super(gui, marker, plot);

			this.instance.TextButton.White.Visible = true;

			this.event.subscribeObservable(
				marker.connected,
				(connected) => {
					this.updateConnectedVisual(connected !== undefined);
					this.clear();

					if (connected) {
						const wire = this.add(WireComponent.create(componentMap.get(connected) as Output, this));
						wire.instance.Parent = wireParent;
					}
				},
				true,
			);
		}

		private updateConnectedVisual(connected: boolean) {
			this.connected = connected;
			this.instance.TextButton.Filled.Visible = connected;
		}

		isConnected() {
			return this.connected;
		}
	}
	export class Output extends Marker {
		constructor(
			gui: MarkerComponentDefinition,
			readonly marker: BlockWireManager.Markers.Output,
			plot: SharedPlot,
		) {
			super(gui, marker, plot);

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
	}
}

namespace Scene {
	export type WireToolSceneDefinition = GuiObject & {
		readonly Bottom: {
			readonly CancelButton: GuiButton;
		};
		readonly NameLabel: TextLabel;
		readonly TextLabel: TextLabel;
	};

	export class WireToolScene extends Control<WireToolSceneDefinition> {
		readonly tool;

		constructor(gui: WireToolSceneDefinition, tool: WireTool) {
			super(gui);
			this.tool = tool;

			this.add(new ButtonControl(this.gui.Bottom.CancelButton, () => this.cancel()));

			this.tool.selectedMarker.subscribe(() => this.update(), true);
			this.event.subscribe(GuiService.GetPropertyChangedSignal("SelectedObject"), () => this.update());
			this.onPrepare(() => this.update());
		}

		private update() {
			this.gui.Bottom.CancelButton.Visible = false;
			this.gui.TextLabel.Visible = false;
			this.gui.NameLabel.Visible = false;

			const inputType = InputController.inputType.get();
			if (inputType !== "Desktop") {
				this.gui.TextLabel.Visible = true;

				if (!this.tool.selectedMarker.get()) {
					this.gui.TextLabel.Text = "CLICK ON THE FIRST POINT";
					this.gui.Bottom.CancelButton.Visible = false;
				} else {
					this.gui.TextLabel.Text = "CLICK ON THE SECOND POINT";
					if (InputController.inputType.get() !== "Gamepad") {
						this.gui.Bottom.CancelButton.Visible = true;
					}
				}
			}

			if (InputController.inputType.get() === "Gamepad") {
				if (GamepadService.GamepadCursorEnabled) {
					if (GuiService.SelectedObject) {
						this.gui.NameLabel.Visible = true;
						this.gui.NameLabel.Text = GuiService.SelectedObject.Name;
						this.gui.NameLabel.TextColor3 = GuiService.SelectedObject.BackgroundColor3;
					} else {
						this.gui.NameLabel.Visible = false;
					}
				}
			}
		}

		private cancel() {
			this.tool.stopDragging();
			this.update();
		}

		show() {
			super.show();

			GuiAnimator.transition(this.gui.TextLabel, 0.2, "down");
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

	constructor(instance: WireComponentDefinition, from: Markers.Output, to: Markers.Input) {
		super(instance);
		this.types = new ObservableValue(from.availableTypes.get());

		this.onEnable(() => (this.instance.Transparency = WireComponent.visibleTransparency));
		this.onDisable(() => (this.instance.Transparency = 1));

		let loop: (() => void) | undefined;
		this.onDestroy(() => loop?.());
		this.event.subscribeObservable(
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
		this.event.subscribeObservable(from.availableTypes, () => this.types.set(from.availableTypes.get()), true);

		WireComponent.staticSetPosition(this.instance, from.position, to.position);
	}

	static staticSetPosition(wire: WireComponentDefinition, from: Vector3, to: Vector3) {
		const distance = to.sub(from).Magnitude;

		wire.Size = new Vector3(distance - 0.4, 0.15, 0.15);
		wire.CFrame = new CFrame(from, to).mul(new CFrame(0, 0, -distance / 2)).mul(CFrame.Angles(0, math.rad(90), 0));
	}
}

namespace Controllers {
	const connectMarkers = (from: Markers.Output, to: Markers.Input, wireParent: ViewportFrame) => {
		if (from.plot !== to.plot) {
			throw "Interplot connections are not supported";
		}

		from.marker.connect(to.marker);
		task.spawn(async () => {
			const result = await ClientBuilding.logicConnectOperation.execute(
				from.plot,
				to.data.blockData.instance,
				to.data.id,
				from.data.blockData.instance,
				from.data.id,
			);

			if (!result.success) {
				LogControl.instance.addLine(result.message, Colors.red);
			}
		});
	};
	const disconnectMarker = (marker: Markers.Input) => {
		marker.marker.disconnect();

		task.spawn(async () => {
			const result = await ClientBuilding.logicDisconnectOperation.execute(
				marker.plot,
				marker.data.blockData.instance,
				marker.data.id,
			);

			if (!result.success) {
				LogControl.instance.addLine(result.message, Colors.red);
			}
		});
	};
	export const hideNonConnectableMarkers = (from: Markers.Output, markers: readonly Markers.Marker[]) => {
		for (const marker of markers) {
			if (marker === from) {
				if (marker instanceof Markers.Output) {
					marker.hideWires();
				}

				continue;
			}

			if (
				marker instanceof Markers.Output ||
				(marker instanceof Markers.Input && !BlockWireManager.canConnect(from.marker, marker.marker))
			) {
				marker.disable();
			}
		}
	};
	export const hideConnectedMarkers = (markers: readonly Markers.Marker[]) => {
		for (const marker of markers) {
			if (!(marker instanceof Markers.Input)) continue;
			if (!marker.isConnected()) continue;

			marker.disable();
		}
	};
	export const showAllMarkers = (markers: readonly Markers.Marker[]) => {
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

		constructor(markers: readonly Markers.Marker[]) {
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
						}, true),
					);
					this.event.subInput((ih) =>
						ih.onMouse2Down(() => {
							if (hoverMarker) {
								connectMarkers(this.marker, hoverMarker, wireParent);
							}
						}, true),
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

		constructor(markers: readonly Markers.Marker[]) {
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
		constructor(markers: readonly Markers.Marker[]) {
			super(markers);

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
	private readonly markers = this.parent(new ComponentChildren<Markers.Marker>(this, true));
	private readonly controllerContainer = new ComponentChild<Controllers.IController>(this, true);

	constructor(mode: BuildingMode) {
		super(mode);

		this.parentGui(
			new Scene.WireToolScene(ToolBase.getToolGui<"Wire", Scene.WireToolSceneDefinition>().Wire, this),
		);

		this.onEnable(() => this.createEverything());
		this.onDisable(() => this.markers.clear());

		this.event.subscribe(ActionController.instance.onUndo, () => {
			this.disable();
			this.enable();
		});
		this.event.subscribe(ActionController.instance.onRedo, () => {
			this.disable();
			this.enable();
		});

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
				const controller = this.controllerContainer.set(new controllers[inputType](this.markers.getAll()));
				controller.selectedMarker.subscribe((m) => this.selectedMarker.set(m), true);
			});
		}

		this.event.subInput((ih) => {
			ih.onKeyDown("F", () => Controllers.hideConnectedMarkers(this.markers.getAll()));
			ih.onKeyUp("F", () => Controllers.showAllMarkers(this.markers.getAll()));
		});

		this.event.subscribe(ClientBuilding.logicDisconnectOperation.executed, (plot, _inputBlock, inputConnection) => {
			//
		});
	}

	stopDragging() {
		this.controllerContainer.get()?.stopDragging();
	}

	private createEverything() {
		this.createEverythingOnPlot(SharedPlots.getOwnPlot());
	}
	private createEverythingOnPlot(plot: SharedPlot) {
		this.markers.clear();

		const components = new Map<BlockWireManager.Markers.Marker, Markers.Marker>();
		for (const [, markers] of BlockWireManager.fromPlot(plot)) {
			let index = 0;
			const size = markers.size();

			for (const marker of markers) {
				const configDef = (blockConfigRegistry as BlockConfigRegistryNonGeneric)[
					(marker.data.blockData as PlacedBlockData).id
				];
				if (!configDef) continue;

				if ((configDef.input[marker.data.id] ?? configDef.output[marker.data.id]).connectorHidden) {
					continue;
				}

				const markerInstance = Markers.Marker.createInstance(
					marker.data.blockData.instance.PrimaryPart!,
					size === 1 ? "center" : index++,
				);

				const component =
					marker instanceof BlockWireManager.Markers.Input
						? new Markers.Input(markerInstance, marker, plot, components)
						: new Markers.Output(markerInstance, marker, plot);

				component.instance.Parent = markerParent;
				components.set(marker, component);
			}
		}

		for (const [, component] of components) {
			this.markers.add(component);
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
			Desktop: [{ keys: ["F"], text: "Hide connected markers" }],
			Gamepad: [
				{ keys: ["ButtonY"], text: "Marker selection mode" },
				{ keys: ["ButtonA"], text: "Click on marker" },
				{ keys: ["ButtonX"], text: "Cancel selection" },
				{ keys: ["ButtonB"], text: "Unequip" },
			],
		};
	}
}
