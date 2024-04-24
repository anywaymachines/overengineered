import { UserInputService } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { Signals } from "client/event/Signals";
import { MultiBlockSelect } from "client/tools/highlighters/MultiBlockSelect";
import { type BlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { MultiModelHighlighter } from "client/tools/highlighters/MultiModelHighlighter";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";

export type HoveredBlocksSelectorMode = keyof typeof HoveredBlocksSelector.Modes;
export class HoveredBlocksSelector extends ClientComponent implements BlockSelector {
	static readonly Modes = {
		single: (block: BlockModel): BlockModel[] => [block],
		assembly: (block: BlockModel): BlockModel[] => {
			// using set to prevent duplicates
			return [
				...new Set(
					block.PrimaryPart!.GetConnectedParts(true).map((b) => BlockManager.getBlockDataByPart(b)!.instance),
				),
			];
		},
		machine: (block: BlockModel): BlockModel[] => {
			const find = (result: Set<BlockModel>, visited: Set<Instance>, instance: BlockModel) => {
				for (const part of instance.GetDescendants()) {
					if (!part.IsA("BasePart")) continue;

					const assemblyConnected = part.GetConnectedParts(false);
					for (const cpart of assemblyConnected) {
						if (visited.has(cpart)) {
							continue;
						}

						visited.add(cpart);

						const connected = BlockManager.getBlockDataByPart(cpart)!.instance;
						result.add(connected);
						find(result, visited, connected);
					}
				}
			};

			const result = new Set<BlockModel>();
			find(result, new Set(), block);

			return [...result];
		},
	};

	private readonly _highlighted = new ObservableValue<readonly BlockModel[]>([]);
	readonly highlighted = this._highlighted.asReadonly();
	private readonly _submit = new ArgsSignal<[blocks: readonly BlockModel[]]>();
	readonly submit = this._submit.asReadonly();

	constructor(parent: Instance, getTargets: (block: BlockModel) => readonly BlockModel[]) {
		super();

		const highlighter = this.parent(new MultiModelHighlighter(parent, this.highlighted));
		let prevTarget: Instance | undefined;

		const empty = [] as const;
		const destroyHighlight = () => {
			prevTarget = undefined;
			this._highlighted.set(empty);
		};

		const updateTarget = () => {
			const add =
				UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1) ||
				UserInputService.IsKeyDown("ButtonX");

			const target = MultiBlockSelect.getTargetedBlock();
			if (!target) {
				if (!add) destroyHighlight();
				return;
			}

			if (target === prevTarget) {
				return;
			}
			prevTarget = target;

			const targets = getTargets(target);
			this._highlighted.set(add ? [...new Set([...this._highlighted.get(), ...targets])] : targets);
		};
		const submit = () => {
			highlighter.disable();
			this._submit.Fire(this.highlighted.get());
			this.destroy();
		};

		this.onPrepare((inputType, eh, ih) => {
			eh.subscribe(SharedPlot.anyChanged, updateTarget);
			ih.onInputBegan(() => {
				prevTarget = undefined;
				updateTarget();
			});
			ih.onInputChanged(updateTarget);
			ih.onInputEnded((input) => {
				if (input.UserInputType === Enum.UserInputType.MouseButton1) {
					return;
				}

				prevTarget = undefined;
				updateTarget();
			});
			eh.subscribe(Signals.CAMERA.MOVED, updateTarget);

			if (inputType === "Desktop") {
				ih.onMouse1Up(submit, true);
			} else if (inputType === "Gamepad") {
				this.inputHandler.onKeyUp("ButtonX", submit);
			} else if (inputType === "Touch") {
				this.inputHandler.onTouchTap(submit, false);
			}

			updateTarget();
		});
		this.onDisable(destroyHighlight);
	}
}
