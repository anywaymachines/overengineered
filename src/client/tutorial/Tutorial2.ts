import { Workspace, Players, RunService } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ArgsSignal, Signal } from "shared/event/Signal";
import { JSON } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import { Localization } from "shared/Localization";
import { CustomRemotes } from "shared/Remotes";
import { PartUtils } from "shared/utils/PartUtils";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { BuildTool } from "client/tools/BuildTool";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
class TutorialPlot extends Component {
	private readonly instance: Folder;
	private readonly plot: BuildingPlot;
	private readonly actualPlot: ReadonlyPlot;

	constructor(plot: ReadonlyPlot, @inject blockRegistry: BlockRegistry) {
		super();

		this.actualPlot = plot;

		this.instance = new Instance("Folder");
		this.instance.Name = "TutorialPreview";
		this.instance.Parent = Workspace;
		ComponentInstance.init(this, this.instance);

		this.plot = new BuildingPlot(this.instance, plot.origin, plot.boundingBox, blockRegistry);
	}

	build(blocks: LatestSerializedBlocks) {
		BlocksSerializer.deserializeFromObject(blocks, this.plot);

		for (const block of this.plot.getBlocks()) {
			PartUtils.ghostModel(block, Colors.white);
		}
	}
	highlight(uuids: readonly BlockUuid[]): SignalConnection {
		const highlights: Instance[] = [];

		for (const uuid of uuids) {
			const block = this.actualPlot.getBlock(uuid);

			const selectionBox = new Instance("SelectionBox");
			selectionBox.Adornee = block;
			selectionBox.Color3 = Color3.fromRGB(255);
			selectionBox.SurfaceTransparency = 1;
			selectionBox.Transparency = 0;
			selectionBox.LineThickness = 0.05;
			selectionBox.Parent = block;

			highlights.push(selectionBox);
		}

		return {
			Disconnect() {
				for (const highlight of highlights) {
					highlight.Destroy();
				}
			},
		};
	}
	clearBlocks() {
		this.plot.deleteOperation.execute("all");
	}
}

export type TutorialControlDefinition = Frame & {
	readonly Header: TextLabel & {
		readonly Cancel: TextButton;
		readonly Next: TextButton;
		readonly Skip: TextButton;
	};
	readonly TextLabel: TextLabel;
};
export class TutorialControl extends Control<TutorialControlDefinition> {
	private readonly _onCancel = new ArgsSignal();
	readonly onCancel = this._onCancel.asReadonly();

	private readonly _nextPressed = new ArgsSignal();
	readonly nextPressed = this._nextPressed.asReadonly();

	private readonly _skipPressed = new ArgsSignal();
	readonly skipPressed = this._skipPressed.asReadonly();

	constructor(title: string) {
		super(Gui.getGameUI<{ Tutorial: TutorialControlDefinition }>().Tutorial.Clone());
		this.gui.Parent = Gui.getGameUI();

		this.gui.Header.Text = title;

		this.add(new ButtonControl(this.gui.Header.Cancel, () => this._onCancel.Fire()));
		this.add(new ButtonControl(this.gui.Header.Next, () => this._nextPressed.Fire()));
		this.add(new ButtonControl(this.gui.Header.Skip, () => this._skipPressed.Fire()));
	}
}

export type TutorialTasksDefinition = Frame & {
	readonly TaskList: TextLabel & {
		readonly Task: Frame & {
			readonly NumLabel: TextLabel;
			readonly TextLabel: TextLabel;
		};
	};
};
export class TutorialTasksControl extends Control<TutorialTasksDefinition> {
	private readonly taskTemplate;
	private readonly list;

	constructor() {
		super(Gui.getGameUI<{ Tasks: TutorialTasksDefinition }>().Tasks.Clone());
		this.gui.Parent = Gui.getGameUI();

		this.taskTemplate = this.asTemplate(this.gui.TaskList.Task);
		this.list = this.add(new Control(this.gui.TaskList));
	}

	setTasks(tasks: readonly string[]) {
		this.list.clear();

		let i = 0;
		for (const task of tasks) {
			const gui = this.taskTemplate();
			gui.NumLabel.Text = tostring(++i);
			gui.TextLabel.Text = task;

			this.list.add(new Control(gui));
		}
	}
}

namespace Steps {
	export type Reg = {
		readonly connection: SignalConnection;
		readonly autoComplete?: () => void;
	};
	type Resolver = () => void;

	function createWaiter() {
		let res: (value: unknown) => void;
		const promise = new Promise((resolve) => (res = resolve));

		return {
			resolve: () => res(undefined),
			wait: () => Objects.awaitThrow(promise),
		} as const;
	}
	export function execute<TArgs extends unknown[]>(
		func: (...args: [...args: TArgs, resolve: Resolver]) => Reg,
		...args: TArgs
	): TutorialPartRegistration {
		const { resolve, wait } = createWaiter();
		const { connection, autoComplete } = func(...[...args, resolve]);

		return { connection, wait, autoComplete };
	}

	export function waitForText(ui: TutorialControl, text: string, resolve: Resolver): Reg {
		const gui = ui.instance;
		gui.TextLabel.Text = "";
		gui.Header.Cancel.Visible = false;
		gui.Header.Next.Visible = false;

		const translatedText = Localization.translateForPlayer(Players.LocalPlayer, text);
		const thr = task.spawn(() => {
			// Animated text
			for (const symbol of translatedText) {
				gui.TextLabel.Text = gui.TextLabel.Text + symbol;
				task.wait(RunService.IsStudio() ? 0 : 0.05);
			}

			resolve();
		});

		return {
			connection: Signal.connection(() => {
				gui.Header.Cancel.Visible = true;
				gui.TextLabel.Text = translatedText;
			}),
			autoComplete: () => {
				task.cancel(thr);
				gui.Header.Cancel.Visible = true;
				gui.TextLabel.Text = translatedText;
			},
		};
	}
	export function waitForNext(ui: TutorialControl, resolve: Resolver): Reg {
		ui.instance.Header.Next.Visible = true;
		ui.instance.Header.Skip.Visible = false;

		const c1 = Signal.connection(() => {
			ui.instance.Header.Next.Visible = false;
			ui.instance.Header.Skip.Visible = true;
		});
		const c2 = ui.nextPressed.Connect(resolve);

		return { connection: Signal.multiConnection(c1, c2) };
	}
	export function waitForBuild(
		blocksToPlace: LatestSerializedBlocks,
		buildTool: BuildTool,
		plot: SharedPlot,
		resolve: Resolver,
	): Reg {
		const c1 = ClientBuilding.placeOperation.addMiddleware((args) => {
			const empty = {};
			const bs = args.blocks
				.map((block): PlaceBlockRequest | {} => {
					const btp = blocksToPlace.blocks.find(
						(value) =>
							value.id === block.id &&
							VectorUtils.roundVector3(value.location.Position) ===
								VectorUtils.roundVector3(
									args.plot.instance.BuildingArea.CFrame.ToObjectSpace(block!.location).Position,
								),
					);
					if (!btp) return empty;

					return {
						...block,
						location: args.plot.instance.BuildingArea.CFrame.ToWorldSpace(btp.location),
						uuid: btp.uuid,
					};
				})
				.filter((c) => c !== empty) as PlaceBlockRequest[];

			if (bs.size() !== args.blocks.size()) {
				return { success: false, message: "Invalid placement" };
			}

			return { success: true, arg: { ...args, blocks: bs } };
		});
		const c2 = ClientBuilding.placeOperation.executed.Connect(({ plot }) => {
			buildTool.gui.blockSelector.highlightedBlocks.set([
				...blocksToPlace.blocks.filter((b) => !plot.tryGetBlock(b.uuid)).mapToSet((b) => b.id),
			]);

			for (const blockToPlace of blocksToPlace.blocks) {
				const placed = plot.tryGetBlock(blockToPlace.uuid);
				if (!placed) return;
			}

			resolve();
		});

		buildTool.gui.blockSelector.highlightedBlocks.set([...blocksToPlace.blocks.mapToSet((b) => b.id)]);
		const c3: SignalConnection = {
			Disconnect() {
				buildTool.gui.blockSelector.highlightedBlocks.set([]);
			},
		};

		return {
			connection: Signal.multiConnection(c1, c2, c3),
			autoComplete: () => {
				ClientBuilding.placeOperation.execute({
					plot: plot,
					blocks: blocksToPlace.blocks
						.filter((b) => !plot.tryGetBlock(b.uuid))
						.map((b) => BlocksSerializer.serializedBlockToPlaceRequest(b, plot.origin)),
				});
			},
		};
	}
	export function waitForDelete(uuidsToDelete: readonly BlockUuid[], plot: SharedPlot, resolve: Resolver): Reg {
		const c1 = ClientBuilding.deleteOperation.addMiddleware((args) => {
			const blocks = args.blocks === "all" ? args.plot.getBlocks() : args.blocks;
			for (const block of blocks) {
				const btp = uuidsToDelete.find((uuid) => uuid === BlockManager.manager.uuid.get(block));
				if (!btp) return { success: false, message: "Invalid placement" };
			}

			return { success: true, arg: args };
		});
		const c2 = ClientBuilding.deleteOperation.executed.Connect(({ plot }) => {
			for (const uuidToDelete of uuidsToDelete) {
				const placed = plot.tryGetBlock(uuidToDelete);
				if (placed) return;
			}

			resolve();
		});

		return {
			connection: Signal.multiConnection(c1, c2),
			autoComplete: () => {
				ClientBuilding.deleteOperation.execute({
					plot: plot,
					blocks: uuidsToDelete
						.filter((uuid) => plot.tryGetBlock(uuid) !== undefined)
						.map((uuid) => plot.getBlock(uuid)),
				});
			},
		};
	}

	export type BlockToConfigure = {
		readonly uuid: BlockUuid;
		readonly key: string;
		readonly value: unknown;
		// readonly properties: object & { readonly [k in string]: unknown };
	};
	export function waitForConfigure(
		blocksToConfigure: readonly BlockToConfigure[],
		plot: SharedPlot,
		resolve: Resolver,
	): Reg {
		const sameProperties = (object: object, properties: object): boolean => {
			for (const [k] of pairs(properties)) {
				if (!(k in object)) {
					return false;
				}
				if (typeOf(object[k]) !== typeOf(properties[k])) {
					return false;
				}

				if (typeIs(object[k], "table")) {
					if (!sameProperties(object[k], properties[k])) {
						return false;
					}

					continue;
				}

				if (object[k] !== properties[k]) {
					return false;
				}
			}

			return true;
		};

		const c1 = ClientBuilding.updateConfigOperation.addMiddleware((args) => {
			return { success: true, arg: args };
		});
		const c2 = ClientBuilding.updateConfigOperation.executed.Connect(({ plot }) => {
			for (const { uuid, key, value } of blocksToConfigure) {
				const block = plot.tryGetBlock(uuid);
				if (!block) return;

				const config = BlockManager.manager.config.get(block) ?? {};
				if (!(key in config)) {
					return;
				}
				if (!typeIs(value, "table")) {
					if (config[key] !== value) {
						return false;
					}
				} else if (!sameProperties(config[key], value)) {
					return;
				}
			}

			resolve();
		});

		return {
			connection: Signal.multiConnection(c1, c2),
			autoComplete: () => {
				ClientBuilding.updateConfigOperation.execute({
					plot: plot,
					configs: blocksToConfigure.map(({ uuid, key, value }): ConfigUpdateRequest["configs"][number] => ({
						block: plot.getBlock(uuid),
						key,
						value: JSON.serialize(value),
					})),
				});
			},
		};
	}
}

export type TutorialPartRegistration = {
	readonly connection: SignalConnection;
	readonly wait: () => void;
	readonly autoComplete?: () => void;
};

@injectable
export class Tutorial extends Component {
	private readonly ghostPlot;
	private readonly ui;
	private readonly uiTasks;

	constructor(
		title: string,
		@inject private readonly sharedPlot: SharedPlot,
		@inject private readonly plot: ReadonlyPlot,
		@inject readonly buildingMode: BuildingMode,
		@inject di: DIContainer,
	) {
		super();

		this.ui = this.parentGui(new TutorialControl(title));
		this.ui.onCancel.Connect(() => this.destroy());

		this.uiTasks = this.parent(new TutorialTasksControl());
		this.uiTasks.hide();

		this.ghostPlot = di.resolveForeignClass(TutorialPlot, [plot]);

		this.onEnable(() => {
			try {
				LoadingController.show(`Starting tutorial...`);
				CustomRemotes.modes.set.send("build");
			} catch {
				// empty
			}

			ClientBuilding.deleteOperation.execute({ plot: sharedPlot, blocks: "all" });
			LoadingController.hide();
		});
	}

	tasksPart(...tasks: readonly string[]): TutorialPartRegistration {
		this.uiTasks.show();
		this.uiTasks.setTasks(tasks);

		return {
			wait: () => {},
			connection: Signal.connection(() => this.uiTasks.hide()),
		};
	}
	partText(text: string): TutorialPartRegistration {
		return Steps.execute(Steps.waitForText, this.ui, text);
	}
	private showBlocks(blocks: LatestSerializedBlocks): void {
		this.ghostPlot.build(blocks);
	}
	private clearBlocks(): void {
		this.ghostPlot.clearBlocks();
	}
	private highlightBlocks(uuids: readonly string[]): SignalConnection {
		return this.ghostPlot.highlight(uuids as readonly BlockUuid[]);
	}

	partNextButton(): TutorialPartRegistration {
		return Steps.execute(Steps.waitForNext, this.ui);
	}
	partBuild(blocks: LatestSerializedBlocks): TutorialPartRegistration {
		this.showBlocks(blocks);
		const exec = Steps.execute(
			Steps.waitForBuild,
			blocks,
			this.buildingMode.toolController.allTools.buildTool,
			this.sharedPlot,
		);

		return {
			...exec,
			connection: Signal.multiConnection(
				exec.connection,
				Signal.connection(() => this.clearBlocks()),
			),
		} as const;
	}
	partDelete(uuids: readonly string[]): TutorialPartRegistration {
		const hc = this.highlightBlocks(uuids);
		const exec = Steps.execute(Steps.waitForDelete, uuids as readonly BlockUuid[], this.sharedPlot);

		return {
			...exec,
			connection: Signal.multiConnection(
				hc,
				exec.connection,
				Signal.connection(() => this.clearBlocks()),
			),
		};
	}
	partConfigure(blocks: readonly Steps.BlockToConfigure[]): TutorialPartRegistration {
		const hc = this.highlightBlocks(blocks.map((b) => b.uuid));
		const exec = Steps.execute(Steps.waitForConfigure, blocks, this.sharedPlot);

		return {
			...exec,
			connection: Signal.multiConnection(
				hc,
				exec.connection,
				Signal.connection(() => this.clearBlocks()),
			),
		};
	}

	combineParts(...regs: readonly TutorialPartRegistration[]): TutorialPartRegistration {
		return {
			connection: Signal.connection(() => regs.forEach((p) => p.connection.Disconnect())),
			wait: () => Objects.multiAwait(regs.map((p) => p.wait)),
			autoComplete: () => regs.forEach((p) => p?.autoComplete?.()),
		};
	}
	waitPart(...regs: readonly TutorialPartRegistration[]): void {
		let skipped = false;
		let completed = false;

		const reg = this.combineParts(...regs);

		let connection: SignalConnection | undefined = Signal.multiConnection(
			reg.connection,
			Signal.connection(() => (completed = true)),
			this.ui.skipPressed.Connect(() => (skipped = true)),
		);

		this.eventHandler.register(Signal.connection(() => connection?.Disconnect()));

		const thr = task.spawn(() => {
			reg.wait();
			completed = true;
		});
		while (!completed) {
			if (skipped) {
				task.cancel(thr);
				reg.autoComplete?.();

				break;
			}

			task.wait();
		}

		connection.Disconnect();
		connection = undefined;
	}
}
