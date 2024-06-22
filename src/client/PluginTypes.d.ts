declare interface PluginToolbarButton extends Instance {
	readonly Click: RBXScriptSignal;

	/** Determines whether the button can be clicked when the game viewport is hidden, such as while editing a script in a different Studio tab */
	ClickableWhenViewportHidden: boolean;

	/** Determines whether the button is clickable in general */
	Enabled: boolean;

	/** Roblox asset ID */
	Icon: string;

	SetActive(this: PluginToolbarButton, active: boolean): void;
}
declare interface PluginToolbar {
	CreateButton(
		this: PluginToolbar,
		buttonId: string,
		tooltip: string,
		iconname: string,
		text?: string,
	): PluginToolbarButton;
}
declare interface PluginAction {
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
declare interface PluginMenu {
	/** A string that uniquely identifies this action. */
	ActionId: string;

	/** Whether the PluginAction will be hidden from Studio's shortcuts view. */
	AllowBinding: boolean;

	/** The description of the action, when viewing it from the keyboard shortcuts window in Roblox Studio. */
	readonly StatusTip: string;

	/** The text that is displayed when viewing this action in Roblox Studio. */
	readonly Text: string;
}
declare interface PluginGui extends LayerCollector {
	Title: string;

	/** Binds a function to the PluginGui close button, overriding the default behavior. */
	BindToClose(func: Callback): void;

	/** Returns the position of the mouse relative to the PluginGui. */
	GetRelativeMousePosition(): Vector2;
}
declare interface DockWidgetPluginGui extends PluginGui {
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

declare interface SelectionService extends Instance {
	/** Fires when the Instances selected in Roblox Studio changes. */
	readonly SelectionChanged: RBXScriptSignal;

	Add(...instancesToAdd: Instance[]): void;
	/** Returns an array of currently selected Instances in Roblox Studio. */
	Get(): Instance[];
	Remove(...instancesToRemove: Instance[]): void;
	/** Sets the currently selected objects in Roblox Studio to Instances in the given array. */
	Set(...selection: Instance[]): void;
}
declare interface ChangeHistoryService extends Instance {
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

declare interface Plugin {
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
