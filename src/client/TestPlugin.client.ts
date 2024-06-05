if (game.GetService("RunService").IsRunning()) {
	new Instance("BindableEvent").Event.Wait();
}

declare const TS: { import: (context: LuaSourceContainer, module: Instance, ...path: string[]) => unknown };
const previmport = TS.import;
const selfplugin = script;
TS.import = (mscript, module, ...path) => {
	if (module === game.GetService("ReplicatedStorage")) {
		module = selfplugin.Parent!;
	}

	return previmport(mscript, module, ...path);
};

const copyScripts = (parent: Instance, parentTo: Instance) => {
	for (const child of parent.GetChildren()) {
		if (child.IsA("ModuleScript")) {
			child.Clone().Parent = parentTo;
		} else if (child.IsA("Folder")) {
			const newparent = new Instance("Folder", parentTo);
			newparent.Name = child.Name;
			copyScripts(child, newparent);
		}
	}
};
copyScripts(game.GetService("StarterPlayer").WaitForChild("StarterPlayerScripts").WaitForChild("TS"), script.Parent!);
copyScripts(game.GetService("ReplicatedStorage"), script.Parent!);

import { StarterGui } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { ButtonControl, TextButtonControl } from "client/gui/controls/Button";
import { LabelControl } from "client/gui/controls/LabelControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { Easing } from "shared/component/Easing";
import { EventHandler } from "shared/event/EventHandler";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { ComponentEvents } from "shared/component/ComponentEvents";
import type { Easable } from "shared/component/Easing";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

TS.import = previmport;

interface PluginToolbarButton extends Instance {
	readonly Click: RBXScriptSignal;

	/** Determines whether the button can be clicked when the game viewport is hidden, such as while editing a script in a different Studio tab */
	ClickableWhenViewportHidden: boolean;

	/** Determines whether the button is clickable in general */
	Enabled: boolean;

	/** Roblox asset ID */
	Icon: string;

	SetActive(this: PluginToolbarButton, active: boolean): void;
}
interface PluginToolbar {
	CreateButton(
		this: PluginToolbar,
		buttonId: string,
		tooltip: string,
		iconname: string,
		text?: string,
	): PluginToolbarButton;
}
interface PluginAction {
	readonly Triggered: RBXScriptSignal;

	/** A string that uniquely identifies this action. */
	ActionId: string;

	/** Whether the PluginAction will be hidden from Studio's shortcuts view. */
	AllowBinding: boolean;

	/** The description of the action, when viewing it from the keyboard shortcuts window in Roblox Studio. */
	readonly StatusTip: string;

	/** The text that is displayed when viewing this action in Roblox Studio. */
	readonly Text: string;
}
interface PluginMenu {
	/** A string that uniquely identifies this action. */
	ActionId: string;

	/** Whether the PluginAction will be hidden from Studio's shortcuts view. */
	AllowBinding: boolean;

	/** The description of the action, when viewing it from the keyboard shortcuts window in Roblox Studio. */
	readonly StatusTip: string;

	/** The text that is displayed when viewing this action in Roblox Studio. */
	readonly Text: string;
}
interface PluginGui extends LayerCollector {
	Title: string;

	/** Binds a function to the PluginGui close button, overriding the default behavior. */
	BindToClose(func: Callback): void;

	/** Returns the position of the mouse relative to the PluginGui. */
	GetRelativeMousePosition(): Vector2;
}
interface DockWidgetPluginGui extends PluginGui {
	/** Fires when the user releases their mouse when hovering over a PluginGui during a drag operation started by Plugin:StartDrag(). */
	readonly PluginDragDropped: RBXScriptSignal<(dragData: object) => void>;

	/** Fires when the user's mouse enters a PluginGui during a drag operation started by Plugin:StartDrag(). */
	readonly PluginDragEntered: RBXScriptSignal<(dragData: object) => void>;

	/** Fires when the user's mouse leaves a PluginGui during a drag operation started by Plugin:StartDrag(). */
	readonly PluginDragLeft: RBXScriptSignal<(dragData: object) => void>;

	/** Fires when the user's mouse moves within a PluginGui during a drag operation started by Plugin:StartDrag(). */
	readonly PluginDragMoved: RBXScriptSignal<(dragData: object) => void>;

	/** Fires when the user stops interacting with the window of the PluginGui. */
	readonly WindowFocusReleased: RBXScriptSignal<() => void>;

	/** Fires when the user begins interacting with the window of the PluginGui. */
	readonly WindowFocused: RBXScriptSignal<() => void>;

	/** Describes whether the previous state of this DockWidgetPluginGui was restored when it was created. */
	readonly HostWidgetWasRestored: boolean;
}

interface SelectionService extends Instance {
	/** Fires when the Instances selected in Roblox Studio changes. */
	readonly SelectionChanged: RBXScriptSignal;

	Add(...instancesToAdd: Instance[]): void;
	/** Returns an array of currently selected Instances in Roblox Studio. */
	Get(): Instance[];
	Remove(...instancesToRemove: Instance[]): void;
	/** Sets the currently selected objects in Roblox Studio to Instances in the given array. */
	Set(...selection: Instance[]): void;
}
interface ChangeHistoryService extends Instance {
	/** Fired when the user completes an action. Parameters come from TryBeginRecording() and FinishRecording() */
	readonly OnRecordingFinished: RBXScriptSignal<
		(
			name: string,
			displayName: string | undefined,
			identifier: string | undefined,
			operationn: Enum.FinishRecordingOperation,
			finalOptions: object | undefined,
		) => void
	>;

	/** Fired when the user begins an action. Parameters come from TryBeginRecording() */
	readonly OnRecordingStarted: RBXScriptSignal<(name: string, displayName?: string) => void>;

	/** Fired when the user reverses the undo command. Waypoint describes the type action that has been redone */
	readonly OnRedo: RBXScriptSignal<(waypoint: string) => void>;

	/** Fired when the user undoes an action in studio. Waypoint describes the type action that has been undone */
	readonly OnUndo: RBXScriptSignal<(waypoint: string) => void>;

	/** Communicates to Studio that the identified recording is finished and to take the final operation to complete the recording */
	FinishRecording(identifier: string, operation: Enum.FinishRecordingOperation, finalOptions?: object): void;

	/** Returns whether there are actions that can be redone, and, if there are, returns the last of them */
	// GetCanRedo(): Tuple

	/** Returns whether there are actions that can be undone, and, if there are, returns the last of them */
	// GetCanUndo(): Tuple

	IsRecordingInProgress(identifier?: string): boolean;

	/** Executes the last action that was undone */
	Redo(): void;

	/** Clears the history, causing all undo/redo waypoints to be removed */
	ResetWaypoints(): void;

	/** Sets whether or not the ChangeHistoryService is enabled */
	SetEnabled(state: boolean): void;

	/** Sets a new waypoint which can be used as an undo or redo point */
	SetWaypoint(name: string): void;

	/** Begins tracking changes made to the data model into a recording */
	TryBeginRecording(name: string, displayName?: string): string | undefined;

	Undo(): void;
}

interface Plugin {
	GetMouse(this: Plugin): Mouse;

	CreateToolbar(this: Plugin, name: string): PluginToolbar;

	/** Sets the state of the calling plugin to activated. */
	Activate(this: Plugin, exclusiveMouse: boolean): void;

	/** Creates a PluginAction which is an object that represents a generic performable action in Roblox Studio, with no directly associated Toolbar or Button. */
	CreatePluginAction(
		this: Plugin,
		actionId: string,
		text: string,
		statusTip: string,
		iconName: string,
		allowBinding: boolean,
	): PluginAction;

	/** Creates a new plugin menu. */
	CreatePluginMenu(this: Plugin, id: string, title: string, icon: string): PluginMenu;

	/** Creates a new PluginToolbar with the given name. */
	CreateToolbar(this: Plugin, name: string): PluginToolbar;

	/** Deactivates the plugin. */
	Deactivate(this: Plugin): void;

	/** Creates a DockWidgetPluginGui given a DockWidgetPluginGuiInfo. */
	CreateDockWidgetPluginGui(
		pluginGuiId: string,
		dockWidgetPluginGuiInfo: DockWidgetPluginGuiInfo,
	): DockWidgetPluginGui;
}
declare const plugin: Plugin;

const selectionService = game.GetService("Selection" as keyof Services) as unknown as SelectionService;
const historyService = game.GetService("ChangeHistoryService" as keyof Services) as Instance as ChangeHistoryService;

//

type Anim = WrittenAnim & {
	readonly instances: readonly Instance[];
};
type WrittenAnim = {
	readonly key: string;
	readonly from: Easable;
	readonly to: Easable;

	readonly timeFrom: number;
	readonly timeTo: number;
	readonly style: Enum.EasingStyle["Name"];
	readonly direction: Enum.EasingDirection["Name"];
};

type AnimationGroup = {
	readonly animations: readonly Anim[];
};

namespace MouseMover {
	export function subInputBegan(
		event: ComponentEvents,
		gui: GuiObject,
		started: (x: number, y: number) => void,
		callback: (absx: number, absy: number, relax: number, relay: number) => void,
		ended?: (x: number, y: number) => void,
	) {
		event.subscribe(gui.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			started(input.Position.X, input.Position.Y);
			start(input.Position.X, input.Position.Y, callback, ended);
		});
	}
	export function start(
		startx: number,
		starty: number,
		callback: (absx: number, absy: number, relax: number, relay: number) => void,
		ended?: (x: number, y: number) => void,
	) {
		const eh = new EventHandler();

		eh.subscribe(rootgui.MouseMoved, (x, y) => {
			callback(x, y, x - startx, y - starty);
		});
		eh.subscribe(rootgui.InputEnded, (input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			ended?.(input.Position.X, input.Position.Y);
			eh.unsubscribeAll();
		});
	}
}

class TimelinePart extends Control<TimelineDefinition["Lines"]["Animations"]["Template"]> {
	readonly min = new ObservableValue<number>(0);
	readonly max = new ObservableValue<number>(1);
	readonly minSubmit = new ArgsSignal<[value: number]>();
	readonly maxSubmit = new ArgsSignal<[value: number]>();
	readonly text;

	constructor(gui: TimelineDefinition["Lines"]["Animations"]["Template"], scale: ReadonlyObservableValue<number>) {
		super(gui);

		this.text = this.add(new LabelControl(gui.TextLabel));

		const updateVisual = () => {
			const scal = scale.get();
			const min = this.min.get();
			const max = this.max.get();

			gui.Position = new UDim2(new UDim(min / scal, 0), gui.Position.Y);
			gui.Size = new UDim2(new UDim((max - min) / scal, 0), gui.Size.Y);
		};
		this.event.subscribeObservable(scale, updateVisual);
		this.event.subscribeObservable(this.min, updateVisual);
		this.event.subscribeObservable(this.max, updateVisual);
		updateVisual();

		MouseMover.subInputBegan(
			this.event,
			gui.RightKnob,
			() => {},
			(x, y) => {
				this.max.set(
					math.max(
						0,
						((x - (gui.Parent as GuiObject).AbsolutePosition.X) /
							(gui.Parent as GuiObject).AbsoluteSize.X) *
							scale.get(),
					),
				);
			},
			() => this.minSubmit.Fire(this.min.get()),
		);

		MouseMover.subInputBegan(
			this.event,
			gui.LeftKnob,
			() => {},
			(x, y) => {
				this.min.set(
					math.max(
						0,
						((x - (gui.Parent as GuiObject).AbsolutePosition.X) /
							(gui.Parent as GuiObject).AbsoluteSize.X) *
							scale.get(),
					),
				);
			},
			() => this.maxSubmit.Fire(this.max.get()),
		);
	}
}

type TimelineDefinition = GuiObject & {
	readonly Lines: GuiObject & {
		readonly Animations: GuiObject & {
			readonly Template: GuiObject & {
				readonly LeftKnob: Frame;
				readonly RightKnob: Frame;
				readonly TextLabel: TextLabel;
			};
		};
		readonly Visual: GuiObject & {
			readonly LineTemplate: GuiObject;
			readonly Pointer: GuiObject;
		};
	};
	readonly Time: GuiObject & {
		readonly TimeTemplate: TextLabel;
	};
};
class Timeline extends Control<TimelineDefinition> {
	private readonly _submit = new ArgsSignal<[value: number]>();
	readonly submit = this._submit.asReadonly();
	readonly value;

	readonly min;
	readonly max;

	constructor(gui: TimelineDefinition, defaultMin: number, defaultMax: number) {
		super(gui);

		this.min = new ObservableValue(defaultMin);
		this.max = new ObservableValue(defaultMax);
		this.value = new ObservableValue(defaultMax);

		const lineTemplate = this.asTemplate(gui.Lines.Visual.LineTemplate, true);
		const timeTemplate = this.asTemplate(gui.Time.TimeTemplate, true);

		const visualControl = this.add(new Control(gui));
		const createVisual = () => {
			visualControl.clear();

			const lineAmount = 10;
			for (let i = 0; i <= lineAmount; i++) {
				const percentage = i / lineAmount;

				const time = timeTemplate();
				time.Text = string.format("%.2f", percentage * (this.max.get() - this.min.get()) + this.min.get());
				time.Position = new UDim2(percentage, 0, 0, 0);
				time.Parent = gui.Time;
				visualControl.add(new Control(time));

				const line = lineTemplate();
				line.Position = time.Position;
				line.Parent = gui.Lines.Visual;
				visualControl.add(new Control(line));
			}
		};

		this.min.subscribe(createVisual);
		this.max.subscribe(createVisual);
		createVisual();

		const clampValue = () => {
			this.value.set(math.clamp(this.value.get(), this.min.get(), this.max.get()));
			updateVisual();
		};
		this.min.subscribe(clampValue);
		this.max.subscribe(clampValue);
		this.value.subscribe(clampValue);

		//

		const updateVisual = () => {
			gui.Lines.Visual.Pointer.Position = new UDim2(
				(this.value.get() - this.min.get()) / (this.max.get() - this.min.get()),
				0,
				0,
				0,
			);
		};
		this.event.subscribeObservable(this.value, updateVisual);

		let pressing = false;
		const move = (x: number) => {
			if (!pressing) return;
			const percentage = math.clamp((x - gui.AbsolutePosition.X) / gui.AbsoluteSize.X, 0, 1);
			const value = percentage * (this.max.get() - this.min.get()) + this.min.get();

			this.value.set(value);
		};
		const stop = (x: number) => {
			move(x);
			this._submit.Fire(this.value.get());
			pressing = false;
		};

		this.event.subscribe(gui.InputEnded, (input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
			stop(input.Position.X);
		});
		this.event.subscribe(gui.MouseLeave, stop);

		this.event.subscribe(gui.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
			pressing = true;
			move(input.Position.X);
			this._submit.Fire(this.value.get());
		});
		this.event.subscribe(gui.MouseMoved, move);
	}
}

namespace AnimationController {
	export type State = {
		readonly stop: () => void;
	};

	export function processFrame(anim: Anim, time: number) {
		for (const instance of anim.instances) {
			(instance as Instance & Record<string, Easable>)[anim.key] = Easing.easeValue(
				(time - anim.timeFrom) / (anim.timeTo - anim.timeFrom),
				anim.from,
				anim.to,
				anim.style,
				anim.direction,
			);
		}
	}
}

namespace ScriptIO {
	const version = 1;

	function instanceToScriptPath(instance: Instance, relative: Instance): string {
		const findCommonAncestor = (instance1: Instance, instance2: Instance): Instance | undefined => {
			const getAllParentsIncludingSelf = (instance: Instance): Instance[] => {
				const parents: Instance[] = [instance];
				let currentInstance = instance;

				while (currentInstance.Parent !== undefined) {
					parents.push(currentInstance.Parent);
					currentInstance = currentInstance.Parent;
				}

				return parents;
			};

			const parents1 = getAllParentsIncludingSelf(instance1);
			const parents2 = new Set(getAllParentsIncludingSelf(instance2));
			for (const parent of parents1) {
				if (parents2.has(parent)) {
					return parent;
				}
			}

			return undefined;
		};

		if (instance === relative) return "script";

		const commonParent = findCommonAncestor(instance, relative);
		const path: string[] = ["script"];

		let p: Instance = relative;
		while (true as boolean) {
			if (p === commonParent) {
				break;
			}

			path.push("Parent");

			const nextp = p.Parent;
			if (!nextp) break;

			p = nextp;
		}

		const backpath: string[] = [];
		p = instance;
		while (true as boolean) {
			if (p === commonParent) {
				break;
			}

			backpath.push(p.Name);

			const nextp = p.Parent;
			if (!nextp) break;

			p = nextp;
		}

		for (let i = backpath.size() - 1; i >= 0; i--) {
			path.push(backpath[i]);
		}

		return path.join(".");

		/* testing code, may be useful
		const frame1 = new Instance("Frame");
		frame1.Name = "Frame1";
		frame1.Parent = game.GetService("Workspace");
		const frame2 = new Instance("Frame");
		frame2.Name = "Frame2";
		frame2.Parent = frame1;
		const frame3 = new Instance("Frame");
		frame3.Name = "Frame3";
		frame3.Parent = frame2;
		const frame4 = new Instance("Frame");
		frame4.Name = "Frame4";
		frame4.Parent = frame1;

		print("--");
		print(instanceToScriptPath(frame1, frame1));
		print(instanceToScriptPath(frame1, frame2));
		print(instanceToScriptPath(frame1, frame3));
		print(instanceToScriptPath(frame1, frame4));
		print("--");

		print(instanceToScriptPath(frame2, frame1));
		print(instanceToScriptPath(frame2, frame2));
		print(instanceToScriptPath(frame2, frame3));
		print(instanceToScriptPath(frame2, frame4));
		print("--");

		print(instanceToScriptPath(frame3, frame1));
		print(instanceToScriptPath(frame3, frame2));
		print(instanceToScriptPath(frame3, frame3));
		print(instanceToScriptPath(frame3, frame4));
		print("--");

		print(instanceToScriptPath(frame4, frame1));
		print(instanceToScriptPath(frame4, frame2));
		print(instanceToScriptPath(frame4, frame3));
		print(instanceToScriptPath(frame4, frame4));
		print("--");
		*/
	}

	type Saveable = undefined | number | string | UDim2 | UDim | Vector2 | Vector3 | Color3;
	function objectToLuaString(object: Saveable): string {
		if (object === undefined) return "nil";
		if (typeIs(object, "number")) return tostring(object);
		if (typeIs(object, "string")) return `"${tostring(object)}"`;
		if (typeIs(object, "UDim")) return `UDim.new(${object.Scale}, ${object.Offset})`;
		if (typeIs(object, "UDim2")) return `UDim2.new(${objectToLuaString(object.X)}, ${objectToLuaString(object.Y)})`;
		if (typeIs(object, "Vector2")) return `Vector2.new(${object.X}, ${object.Y})`;
		if (typeIs(object, "Vector3")) return `Vector3.new(${object.X}, ${object.Y}, ${object.Z})`;
		if (typeIs(object, "Color3")) return `Color3.fromHex(${objectToLuaString(object.ToHex())})`;

		throw `Unknown object type ${typeOf(object)}`;
	}

	export function readAnimationFromScript(mscript: ModuleScript & { Source: string }): AnimationGroup {
		const origParent = mscript.Parent;
		mscript = mscript.Clone();
		mscript.Parent = origParent;

		const ret = require(mscript) as AnimationGroup;
		mscript.Destroy();
		return ret;
	}
	export function writeAnimationToScript(anim: AnimationGroup, mscript: ModuleScript & { Source: string }) {
		const animToString = (anim: Anim): string => {
			return `{
				key = "${anim.key}",
				from = ${objectToLuaString(anim.from)},
				to = ${objectToLuaString(anim.to)},
				timeFrom = ${anim.timeFrom},
				timeTo = ${anim.timeTo},
				style = "${anim.style}",
				direction = "${anim.direction}",
				instances = {
					${anim.instances.map((instance, i) => `[${i + 1}] = ${instanceToScriptPath(instance, mscript)}`).join(",\n")}
				}
			}`;
		};

		mscript.Source = `
			return {
				version = ${version},
				animations = {
					${anim.animations.map((anim, i) => `[${i + 1}] = ${animToString(anim)}`).join(",\n")}
				}
			}
		`;
	}
}

type AnimControlsDefinition = GuiObject & {
	readonly Key: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly Min: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly Max: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly EasingStyle: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly EasingDirection: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly Instance: GuiObject & {
		readonly TextBox: TextBox;
		readonly SelectInstance: GuiButton;
	};
	readonly SetFrom: GuiButton;
	readonly SetTo: GuiButton;
};
class AnimControls extends Control<AnimControlsDefinition> {
	constructor(gui: AnimControlsDefinition, animation: ObservableValue<Anim | undefined>) {
		super(gui);

		const sub = <T extends unknown[]>(signal: ArgsSignal<T>, func: (animation: Anim, ...args: T) => void) => {
			this.event.subscribe(signal, (...args) => {
				const prevanim = animation.get();
				if (!prevanim) return;

				func(prevanim, ...args);
			});
		};

		const key = this.add(new TextBoxControl(gui.Key.TextBox));
		this.event.subscribeObservable(animation, (anim) => key.text.set(anim?.key ?? ""), true);
		sub(key.submitted, (prevanim, key) => animation.set({ ...prevanim, key }));

		const min = this.add(new NumberTextBoxControl(gui.Min.TextBox));
		this.event.subscribeObservable(animation, (anim) => min.value.set(anim?.timeFrom ?? 0), true);
		sub(min.submitted, (prevanim, min) => animation.set({ ...prevanim, timeFrom: min }));

		const style = this.add(new TextBoxControl(gui.EasingStyle.TextBox));
		this.event.subscribeObservable(animation, (anim) => style.text.set(anim?.style ?? "Quad"), true);
		sub(style.submitted, (prevanim, style) =>
			animation.set({ ...prevanim, style: style as Enum.EasingStyle["Name"] }),
		);

		const direction = this.add(new TextBoxControl(gui.EasingDirection.TextBox));
		this.event.subscribeObservable(animation, (anim) => direction.text.set(anim?.direction ?? "Out"), true);
		sub(direction.submitted, (prevanim, direction) =>
			animation.set({ ...prevanim, direction: direction as Enum.EasingDirection["Name"] }),
		);

		const max = this.add(new NumberTextBoxControl(gui.Max.TextBox));
		this.event.subscribeObservable(animation, (anim) => max.value.set(anim?.timeTo ?? 1), true);
		sub(max.submitted, (prevanim, max) => animation.set({ ...prevanim, timeTo: max }));

		this.add(
			new ButtonControl(gui.Instance.SelectInstance, () => {
				const prevanim = animation.get();
				if (!prevanim) return;

				animation.set({ ...prevanim, instances: selectionService.Get() });
			}),
		);
		this.event.subscribeObservable(
			animation,
			(anim) => (gui.Instance.TextBox.Text = anim?.instances.map((i) => i.Name).join(", ") ?? ""),
			true,
		);

		this.add(
			new ButtonControl(gui.SetFrom, () => {
				const prevanim = animation.get();
				if (!prevanim) return;

				animation.set({
					...prevanim,
					from: (prevanim.instances[0] as Instance & Record<string, Easable>)[prevanim.key],
				});
			}),
		);

		this.add(
			new ButtonControl(gui.SetTo, () => {
				const prevanim = animation.get();
				if (!prevanim) return;

				animation.set({
					...prevanim,
					to: (prevanim.instances[0] as Instance & Record<string, Easable>)[prevanim.key],
				});
			}),
		);
	}
}

type AnimationGroupControlsDefinition = GuiObject & {
	readonly Play: GuiButton;
	readonly SelectScript: GuiButton;
	readonly CreateScript: GuiButton;
	readonly SaveScript: GuiButton;
	readonly Length: GuiObject & {
		readonly TextBox: TextBox;
	};
	readonly AddAnim: GuiButton;
	readonly DeleteAnim: GuiButton;
};
class AnimationGroupControls extends Control<AnimationGroupControlsDefinition> {
	constructor(
		gui: AnimationGroupControlsDefinition,
		animationGroup: ObservableValue<AnimationGroup>,
		timelineScale: ObservableValue<number>,
		selectedAnimIndex: ObservableValue<number>,
	) {
		super(gui);

		this.add(
			new ButtonControl(gui.SelectScript, () => {
				const selection = selectionService.Get();
				if (selection.size() !== 1 || !selection[0].IsA("ModuleScript") || !selection[0].HasTag("i3Animator")) {
					animationGroup.set({ animations: [] });
					return;
				}

				animationGroup.set(ScriptIO.readAnimationFromScript(selection[0] as ModuleScript & { Source: string }));
			}),
		);
		this.add(
			new ButtonControl(gui.CreateScript, () => {
				const selection = selectionService.Get();

				const historyIdentifier = historyService.TryBeginRecording("Create animator scripts");

				for (const selected of selection) {
					const mscript = new Instance("ModuleScript") as ModuleScript & { Source: string };
					mscript.Name = "i3Animator";
					ScriptIO.writeAnimationToScript({ animations: [] }, mscript);
					mscript.AddTag("i3Animator");

					mscript.Parent = selected;
				}

				if (historyIdentifier !== undefined) {
					historyService.FinishRecording(historyIdentifier, Enum.FinishRecordingOperation.Commit);
				}
			}),
		);
		this.add(
			new ButtonControl(gui.SaveScript, () => {
				const selection = selectionService.Get();
				if (selection.size() !== 1 || !selection[0].IsA("ModuleScript") || !selection[0].HasTag("i3Animator")) {
					animationGroup.set({ animations: [] });
					return;
				}

				ScriptIO.writeAnimationToScript(
					animationGroup.get(),
					selection[0] as ModuleScript & { Source: string },
				);
			}),
		);

		const scale = this.add(new NumberTextBoxControl(gui.Length.TextBox));
		this.event.subscribeObservable(timelineScale, (length) => scale.value.set(length), true);
		this.event.subscribe(scale.submitted, (length) => timelineScale.set(length));

		this.add(
			new ButtonControl(gui.AddAnim, () => {
				animationGroup.set({
					...animationGroup.get(),
					animations: [
						...animationGroup.get().animations,
						{
							instances: [],
							key: "Transparency",
							from: 0,
							to: 1,
							timeFrom: 0,
							timeTo: 1,
							direction: "Out",
							style: "Quad",
						},
					],
				});
			}),
		);
		this.add(
			new ButtonControl(gui.DeleteAnim, () => {
				const animations = [...animationGroup.get().animations];
				animations.remove(selectedAnimIndex.get());

				animationGroup.set({ ...animationGroup.get(), animations });
			}),
		);
	}
}

type AnimationTimelineDefinition = GuiObject & {
	readonly Timeline: TimelineDefinition;
	readonly Controls: AnimControlsDefinition;
	readonly GroupControls: AnimationGroupControlsDefinition;
	readonly Animations: GuiObject & {
		readonly ScrollingFrame: ScrollingFrame & {
			readonly Template: TextButtonDefinition;
		};
	};
};
class AnimationTimeline extends Control<AnimationTimelineDefinition> {
	private readonly timeline;
	private readonly selectedAnimIndex = new ObservableValue<number>(0);
	private readonly animation = new ObservableValue<AnimationGroup>({ animations: [] });
	private readonly timelineScale = new ObservableValue<number>(2);

	constructor(gui: AnimationTimelineDefinition) {
		super(gui);

		this.timeline = this.add(new Timeline(gui.Timeline, 0, 1));
		this.add(
			new AnimationGroupControls(gui.GroupControls, this.animation, this.timelineScale, this.selectedAnimIndex),
		);
		this.event.subscribeObservable(this.timelineScale, (scale) => this.timeline.max.set(scale), true);

		{
			const anim = new ObservableValue<Anim | undefined>(undefined);
			anim.subscribe((anim) => {
				if (!anim) return;

				const animations = [...this.animation.get().animations];
				animations[this.selectedAnimIndex.get()] = anim;

				this.animation.set({ ...this.animation.get(), animations });
			});
			this.event.subscribeObservable(this.selectedAnimIndex, (index) => {
				anim.set(this.animation.get().animations[index]);
			});
			this.event.subscribeObservable(this.animation, (animation) => {
				anim.set(animation.animations[this.selectedAnimIndex.get()]);
			});
			this.add(new AnimControls(gui.Controls, anim));
		}

		const updateTimeline = () => {
			const animations = this.animation.get();

			if (animations.animations.size() > 0) {
				this.timelineScale.set(
					math.max(this.timelineScale.get(), ...animations.animations.map((a) => a.timeTo)),
				);
			}
		};

		let playing = false;
		const startPlaying = () => {
			playing = true;

			task.spawn(() => {
				while (playing) {
					const dt = task.wait();
					if (!playing) break;

					this.timeline.value.set(this.timeline.value.get() + dt);
					if (this.timeline.value.get() >= this.timelineScale.get()) {
						stopPlaying();
					}
				}
			});
		};
		const stopPlaying = () => (playing = false);
		this.onDisable(stopPlaying);

		this.add(
			new ButtonControl(gui.GroupControls.Play, () => {
				if (playing) {
					stopPlaying();
				} else {
					if (this.timeline.value.get() >= this.timelineScale.get()) {
						this.timeline.value.set(0);
					}

					startPlaying();
				}
			}),
		);
		this.event.subscribe(this.timeline.submit, stopPlaying);

		const timelinePartTemplate = this.asTemplate(gui.Timeline.Lines.Animations.Template);
		const timelinePartList = this.add(new Control<GuiObject, TimelinePart>(gui.Timeline.Lines.Animations));
		this.event.subscribeObservable(
			this.animation,
			(animations) => {
				stopPlaying();
				updateTimeline();

				timelinePartList.clear();

				for (let i = 0; i < animations.animations.size(); i++) {
					const animation = animations.animations[i];

					const part = timelinePartList.add(new TimelinePart(timelinePartTemplate(), this.timelineScale));
					part.instance.Position = new UDim2(0, 0, 0, i * (20 + 4));
					part.min.set(animation.timeFrom);
					part.max.set(animation.timeTo);
					part.text.value.set(animation.key);

					const update = () => {
						const animations = [...this.animation.get().animations];
						animations[i] = {
							...animations[i],
							timeFrom: part.min.get(),
							timeTo: part.max.get(),
						};

						this.animation.set({ ...this.animation.get(), animations });
					};
					part.minSubmit.Connect(update);
					part.maxSubmit.Connect(update);
				}
			},
			true,
		);

		const animationButtonTemplate = this.asTemplate(gui.Animations.ScrollingFrame.Template);
		const animationList = this.add(new Control(gui.Animations.ScrollingFrame));
		this.event.subscribeObservable(
			this.animation,
			(animations) => {
				stopPlaying();
				updateTimeline();

				animationList.clear();

				for (let i = 0; i < animations.animations.size(); i++) {
					const animation = animations.animations[i];

					const btn = animationList.add(
						new TextButtonControl(animationButtonTemplate(), () => this.selectedAnimIndex.set(i)),
					);
					btn.text.set(`${animation.key} @ ${animation.instances.map((i) => i.Name).join(", ")}`);
				}
			},
			true,
		);

		this.event.subscribeObservable(this.timeline.value, (time) => {
			for (const anim of this.animation.get().animations) {
				AnimationController.processFrame(anim, time);
			}
		});
	}
}

//

const toolbar = plugin.CreateToolbar("Animator");
const pluginButton = toolbar.CreateButton("MEGAPLUGIN", "Show animator", "rbxassetid://1507949215");

const info = new DockWidgetPluginGuiInfo(Enum.InitialDockState.Left, false);
const widget = plugin.CreateDockWidgetPluginGui("eye3m", info);
widget.Title = "Animator";

type PluginGuiDefinition = AnimationTimelineDefinition;
const gui = StarterGui.WaitForChild("PluginStuff").WaitForChild("Main").Clone() as PluginGuiDefinition;
const rootgui = gui;
gui.Visible = true;
gui.Parent = widget;

const root = new ContainerComponent();
const timeline = root.add(new AnimationTimeline(gui));

root.setEnabled(widget.Enabled);
pluginButton.Click.Connect(() => {
	widget.Enabled = !widget.Enabled;
	root.setEnabled(widget.Enabled);
});
