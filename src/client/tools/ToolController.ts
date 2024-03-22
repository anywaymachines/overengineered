import { Players, RunService } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { LoadingController } from "client/controller/LoadingController";
import Signals from "client/event/Signals";
import BuildingMode from "client/modes/build/BuildingMode";
import BuildTool from "client/tools/BuildTool";
import BuildTool2 from "client/tools/BuildTool2";
import ConfigTool from "client/tools/ConfigTool";
import DebugTool from "client/tools/DebugTool";
import DeleteTool from "client/tools/DeleteTool";
import PaintTool from "client/tools/PaintTool";
import ToolBase from "client/tools/ToolBase";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import EditTool from "./EditTool";
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

			tools.tools.forEach((tool, i) => {
				this.inputHandler.onKeyDown(keycodes[i], () =>
					tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool),
				);
			});
		});

		const gamepadSelectTool = (isRight: boolean) => {
			if (!tools.selectedTool.get()) {
				tools.selectedTool.set(tools.tools[0]);
				return;
			}

			const currentIndex = tools.tools.indexOf(tools.selectedTool.get()!);
			const toolsLength = tools.tools.size();
			let newIndex = isRight ? currentIndex + 1 : currentIndex - 1;

			if (newIndex >= toolsLength) {
				newIndex = 0;
			} else if (newIndex < 0) {
				newIndex = toolsLength - 1;
			}

			tools.selectedTool.set(tools.tools[newIndex]);
		};
		this.event.onPrepareGamepad(() => {
			this.inputHandler.onKeyDown("ButtonB", () => tools.selectedTool.set(undefined));
			this.inputHandler.onKeyDown("ButtonR1", () => gamepadSelectTool(true));
			this.inputHandler.onKeyDown("ButtonL1", () => gamepadSelectTool(false));
		});
	}
}

export default class ToolController extends ClientComponent {
	readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined);
	readonly tools: readonly ToolBase[];

	readonly buildTool;
	readonly editTool;
	readonly deleteTool;
	readonly configTool;
	readonly paintTool;
	readonly buildTool2;
	readonly wireTool;
	readonly debugTool;

	constructor(mode: BuildingMode) {
		super();

		Signals.PLAYER.DIED.Connect(() => {
			this.selectedTool.set(undefined);
		});

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});

		this.event.subscribeObservable2(
			this.selectedTool,
			(tool) => mode.mirrorVisualizer.setEnabled(tool?.supportsMirror() ?? false),
			true,
		);

		this.buildTool = new BuildTool(mode);
		this.editTool = new EditTool(mode);
		this.deleteTool = new DeleteTool(mode);
		this.configTool = new ConfigTool(mode);
		this.paintTool = new PaintTool(mode);
		this.buildTool2 = new BuildTool2(mode);
		this.debugTool = new DebugTool(mode);
		this.wireTool = new WireTool(mode);

		const tools: ToolBase[] = [
			this.buildTool,
			this.editTool,
			this.deleteTool,
			this.configTool,
			this.paintTool,
			this.wireTool,
		];

		if ((true as boolean) || GameDefinitions.isAdmin(Players.LocalPlayer)) {
			tools.insert(6, this.buildTool2);
		}

		// Debug tool
		if (RunService.IsStudio() && GameDefinitions.isAdmin(Players.LocalPlayer)) {
			tools.insert(7, this.debugTool);
		}

		this.tools = tools;

		let prevTool: ToolBase | undefined = undefined;
		let wasSetByLoading = false;
		this.onEnable(() => (wasSetByLoading = false));

		const input = this.parent(new ToolInputController(this));
		this.event.subscribeObservable2(
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

				input.setEnabled(!loading);
			},
			true,
		);
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.tools];
	}
}
