import { StarterPlayer } from "@rbxts/services";

type PluginToolbarButton = Instance & {
	readonly Click: RBXScriptSignal;

	/** Determines whether the button can be clicked when the game viewport is hidden, such as while editing a script in a different Studio tab */
	ClickableWhenViewportHidden: boolean;

	/** Determines whether the button is clickable in general */
	Enabled: boolean;

	/** Roblox asset ID */
	Icon: string;

	SetActive(this: PluginToolbarButton, active: boolean): void;
};
type PluginToolbar = {
	CreateButton(
		this: PluginToolbar,
		buttonId: string,
		tooltip: string,
		iconname: string,
		text?: string,
	): PluginToolbarButton;
};
type PluginAction = {
	readonly Triggered: RBXScriptSignal;

	/** A string that uniquely identifies this action. */
	ActionId: string;

	/** Whether the PluginAction will be hidden from Studio's shortcuts view. */
	AllowBinding: boolean;

	/** The description of the action, when viewing it from the keyboard shortcuts window in Roblox Studio. */
	readonly StatusTip: string;

	/** The text that is displayed when viewing this action in Roblox Studio. */
	readonly Text: string;
};
type PluginMenu = {
	/** A string that uniquely identifies this action. */
	ActionId: string;

	/** Whether the PluginAction will be hidden from Studio's shortcuts view. */
	AllowBinding: boolean;

	/** The description of the action, when viewing it from the keyboard shortcuts window in Roblox Studio. */
	readonly StatusTip: string;

	/** The text that is displayed when viewing this action in Roblox Studio. */
	readonly Text: string;
};

type Plugin = {
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
};
declare const plugin: Plugin;

type ChangeHistoryService = Instance & {
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
};

//
declare const loadstring: (chunk: string) => LuaTuple<[() => {}, string | undefined]>;
declare const setfenv: (a: unknown, b: unknown) => unknown;

const newCache = () => {
	const cache = new Map<ModuleScript, object>();
	const nocache_require = (moduleScript: ModuleScript & { Source: string }) => {
		print("cac1 " + moduleScript);
		const hasCache = cache.get(moduleScript);
		if (hasCache) return hasCache;
		print("cac2");

		const [module, err] = loadstring(moduleScript.Source);
		if (!module) throw err;
		print("cac3");

		const moduleEnvironment = setmetatable(
			{
				script: moduleScript,
				require: nocache_require,
			},
			{
				__index: getfenv(module as unknown as number),
			} as unknown as LuaMetatable<object>,
		);
		print("cac4");

		setfenv(module, moduleEnvironment);
		print("cac5");
		const e = module();
		print("cacr " + e);
		return e;
	};

	return nocache_require;
};

print("SCRIPT EXECUTOR loading");

const execute = () => {
	print("Executing scripts...");

	const ctest = StarterPlayer.GetDescendants()
		.filter((d) => d.IsA("ModuleScript") && d.HasTag("plugin1"))
		.map((s) => s as ModuleScript & { Source: string });

	for (let test of ctest) {
		const parent = test.Parent;
		test = test.Clone();
		test.Parent = parent;

		try {
			print("[VC] Executing " + test);
			require(test);
		} finally {
			test.Destroy();
		}
	}
};

const history = game.GetService("ChangeHistoryService" as keyof Services) as Instance as ChangeHistoryService;

const toolbar = plugin.CreateToolbar("Visualizer");

const executeBtn = toolbar.CreateButton("Execute scripts", "Execute scripts", "rbxassetid://1507949215");
executeBtn.Click.Connect(() => {
	const historyId = history.TryBeginRecording("Executing gui scripts");

	try {
		execute();
	} finally {
		if (historyId !== undefined) {
			history.FinishRecording(historyId, Enum.FinishRecordingOperation.Commit);
		}
	}
});

print("SCRIPT EXECUTOR loaded");
