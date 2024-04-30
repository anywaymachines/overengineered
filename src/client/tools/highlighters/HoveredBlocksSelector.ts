import { ClientComponent } from "client/component/ClientComponent";
import { Signals } from "client/event/Signals";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
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

	constructor(getTargets: (block: BlockModel) => readonly BlockModel[]) {
		super();

		const highlighter = this.parent(new MultiModelHighlighter(this.highlighted));
		let prevTarget: Instance | undefined;

		const empty = [] as const;
		const destroyHighlight = () => {
			prevTarget = undefined;
			this._highlighted.set(empty);
		};

		let pressing = false;
		const updateTarget = () => {
			const add = pressing;

			const target = BlockSelect.getTargetedBlock();
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
			if (!pressing) return;

			pressing = false;
			highlighter.disable();
			this._submit.Fire(this.highlighted.get());
			highlighter.enable();
		};

		this.onPrepare((inputType, eh, ih) => {
			eh.subscribe(SharedPlot.anyChanged, updateTarget);
			ih.onInputBegan(() => {
				prevTarget = undefined;
				updateTarget();
			});
			ih.onInputChanged(updateTarget);
			ih.onInputEnded((input) => {
				if (
					input.UserInputType === Enum.UserInputType.MouseButton1 ||
					input.UserInputType === Enum.UserInputType.Touch
				) {
					return;
				}

				prevTarget = undefined;
				updateTarget();
			});
			eh.subscribe(Signals.CAMERA.MOVED, updateTarget);

			if (inputType === "Desktop") {
				ih.onMouse1Down(() => (pressing = true), false);
				ih.onMouse1Up(submit, true);
			} else if (inputType === "Gamepad") {
				this.inputHandler.onKeyDown("ButtonX", () => (pressing = true));
				this.inputHandler.onKeyUp("ButtonX", submit);
			} else if (inputType === "Touch") {
				this.inputHandler.onInputEnded((input) => {
					if (input.UserInputType !== Enum.UserInputType.Touch) return;

					pressing = true;
					submit();
				});
			}

			updateTarget();
		});
		this.onDisable(destroyHighlight);
	}
}
