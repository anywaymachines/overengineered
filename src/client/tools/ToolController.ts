import { ClientComponent } from "client/component/ClientComponent";
import { LoadingController } from "client/controller/LoadingController";
import { Signals } from "client/event/Signals";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { BuildTool } from "client/tools/BuildTool";
import { BuildTool2 } from "client/tools/BuildTool2";
import { ConfigTool } from "client/tools/ConfigTool";
import { DeleteTool } from "client/tools/DeleteTool";
import { PaintTool } from "client/tools/PaintTool";
import { ToolBase } from "client/tools/ToolBase";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentDisabler } from "shared/component/ComponentDisabler";
import { MiddlewaredObservableValue } from "shared/event/MiddlewaredObservableValue";
import { Objects } from "shared/fixes/objects";
import { EditTool } from "./EditTool";
import { WireTool } from "./WireTool";

class ToolInputController extends ClientComponent {
	constructor(tools: ToolController) {
		super();

		this.event.onPrepareDesktop(() => {
			const keycodes: readonly KeyCode[] = [
				"One",
				"Two",
				"Three",
				"Four",
				"Five",
				"Six",
				"Seven",
				"Eight",
				"Nine",
			];

			tools.visibleTools.enabled.get().forEach((tool, i) => {
				this.inputHandler.onKeyDown(keycodes[i], () =>
					tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool),
				);
			});
		});

		const gamepadSelectTool = (isRight: boolean) => {
			if (!tools.selectedTool.get()) {
				tools.selectedTool.set(tools.visibleTools.enabled.get()[0]);
				return;
			}

			const currentIndex = tools.visibleTools.enabled.get().indexOf(tools.selectedTool.get()!);
			const toolsLength = tools.visibleTools.enabled.get().size();
			let newIndex = isRight ? currentIndex + 1 : currentIndex - 1;

			if (newIndex >= toolsLength) {
				newIndex = 0;
			} else if (newIndex < 0) {
				newIndex = toolsLength - 1;
			}

			tools.selectedTool.set(tools.visibleTools.enabled.get()[newIndex]);
		};
		this.event.onPrepareGamepad(() => {
			this.inputHandler.onKeyDown("ButtonB", () => tools.selectedTool.set(undefined));
			this.inputHandler.onKeyDown("ButtonR1", () => gamepadSelectTool(true));
			this.inputHandler.onKeyDown("ButtonL1", () => gamepadSelectTool(false));
		});
	}
}

export class ToolController extends ClientComponent {
	readonly selectedTool = new MiddlewaredObservableValue<ToolBase | undefined>(undefined);
	readonly visibleTools: ComponentDisabler<ToolBase>;
	readonly enabledTools: ComponentDisabler<ToolBase>;

	readonly buildTool;
	readonly deleteTool;
	readonly configTool;
	readonly paintTool;
	readonly buildTool2;
	readonly wireTool;

	readonly allTools;
	readonly allToolsOrdered: readonly ToolBase[];

	constructor(mode: BuildingMode) {
		super();

		Signals.PLAYER.DIED.Connect(() => {
			this.selectedTool.set(undefined);
		});

		this.selectedTool.addMiddleware((value) => {
			if (!value) return value;

			if (this.enabledTools.isDisabled(value)) {
				return undefined;
			}

			return value;
		});
		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.event.subscribeObservable(
			this.selectedTool,
			(tool) => mode.mirrorVisualizer.setEnabled(tool?.supportsMirror() ?? false),
			true,
		);

		// array instead of an object for ordering purposes
		const tools = [
			["buildTool2", (this.buildTool2 = new BuildTool2(mode))],
			["editTool", new EditTool(mode)],
			["deleteTool", (this.deleteTool = new DeleteTool(mode))],
			["configTool", (this.configTool = new ConfigTool(mode))],
			["paintTool", (this.paintTool = new PaintTool(mode))],
			["wireTool", (this.wireTool = new WireTool(mode))],
			["buildTool", (this.buildTool = new BuildTool(mode))],
		] as const;

		this.allTools = Objects.fromEntries(tools);
		this.allToolsOrdered = tools.map((t) => t[1]);
		this.enabledTools = new ComponentDisabler(this.allToolsOrdered);
		this.visibleTools = new ComponentDisabler(this.allToolsOrdered);

		this.enabledTools.enabled.subscribe(() => this.selectedTool.set(undefined));
		this.visibleTools.enabled.subscribe(() => this.selectedTool.set(undefined));

		let prevTool: ToolBase | undefined = undefined;
		let wasSetByLoading = false;
		this.onEnable(() => (wasSetByLoading = false));

		const inputParent = new ComponentChild<ToolInputController>(this);
		this.visibleTools.enabled.subscribe(() => inputParent.set(new ToolInputController(this)), true);

		this.event.subscribeObservable(
			LoadingController.isLoading,
			(loading) => {
				if (loading) {
					wasSetByLoading = true;
					prevTool = this.selectedTool.get();
					this.selectedTool.set(undefined);
				} else if (wasSetByLoading) {
					this.selectedTool.set(prevTool);
					prevTool = undefined;
				}

				inputParent.get()?.setEnabled(!loading);
			},
			true,
		);
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.visibleTools.enabled.get()];
	}
}
