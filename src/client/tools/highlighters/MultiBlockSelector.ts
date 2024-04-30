import { UserInputService } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { BoxSelector } from "client/tools/highlighters/BoxSelector";
import { HoveredBlocksSelector, HoveredBlocksSelectorMode } from "client/tools/highlighters/HoveredBlocksSelector";
import { SharedPlot } from "shared/building/SharedPlot";
import { ComponentChild } from "shared/component/ComponentChild";
import { ObservableValue, ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal, ReadonlyArgsSignal } from "shared/event/Signal";

export interface BlockSelector extends IComponent {
	readonly submit: ReadonlyArgsSignal<[blocks: readonly BlockModel[]]>;
}

export type BlockSelectorMode = HoveredBlocksSelectorMode | "box";
export type MultiBlockSelectorConfiguration = {
	readonly enabled?: readonly BlockSelectorMode[];
	readonly filter?: (block: BlockModel) => boolean;
};
export class MultiBlockSelector extends ClientComponent {
	private readonly _submit = new ArgsSignal<[blocks: readonly BlockModel[]]>();
	readonly submit = this._submit.asReadonly();
	readonly mode = new ObservableValue<BlockSelectorMode>("single");

	constructor(plot: ReadonlyObservableValue<SharedPlot>, config?: MultiBlockSelectorConfiguration) {
		super();

		const buttons: Readonly<Record<BlockSelectorMode, KeyCode | undefined>> = {
			single: undefined,
			assembly: config?.enabled?.includes("assembly") === false ? undefined : "LeftControl",
			machine: config?.enabled?.includes("machine") === false ? undefined : "LeftAlt",
			box: config?.enabled?.includes("box") === false ? undefined : "E",
		};
		this.event.subInput((ih) => {
			for (const [bmode, button] of pairs(buttons)) {
				ih.onKeyDown(button, () => this.mode.set(bmode));
				ih.onKeyUp(button, () => {
					if (this.mode.get() === bmode) {
						this.mode.set("single");
					}
				});
			}
		});

		const setBasedOnCurrentInput = () => {
			for (const [bmode, button] of pairs(buttons)) {
				if (!UserInputService.IsKeyDown(button)) continue;

				this.mode.set(bmode);
				return;
			}

			this.mode.set("single");
		};
		this.onEnable(setBasedOnCurrentInput);

		const origModeFuncs = HoveredBlocksSelector.Modes;
		const empty = [] as const;
		const filter = config?.filter;
		const functions: Readonly<Record<HoveredBlocksSelectorMode, (block: BlockModel) => readonly BlockModel[]>> = {
			single: !filter ? origModeFuncs.single : (block) => (filter(block) ? [block] : empty),
			assembly: !filter ? origModeFuncs.assembly : (block) => origModeFuncs.assembly(block).filter(filter),
			machine: !filter ? origModeFuncs.machine : (block) => origModeFuncs.machine(block).filter(filter),
		};

		const modes: Readonly<Record<BlockSelectorMode, () => BlockSelector>> = {
			single: () => new HoveredBlocksSelector(functions.single),
			assembly: () => new HoveredBlocksSelector(functions.assembly),
			machine: () => new HoveredBlocksSelector(functions.machine),
			box: () => new BoxSelector(filter),
		};

		const selectorParent = new ComponentChild<BlockSelector>(this);
		selectorParent.childSet.Connect((child) => {
			if (child) {
				child.submit.Connect((blocks) => this._submit.Fire(blocks));
				return;
			}

			if (!this.isEnabled()) return;

			setBasedOnCurrentInput();
			if (!selectorParent.get()) {
				selectorParent.set(modes[this.mode.get()]());
			}
		});

		const updateSelector = () => selectorParent.set(modes[this.mode.get()]());
		this.event.subscribeObservable(this.mode, updateSelector);
		this.event.subscribeObservable(plot, updateSelector);
		this.onEnable(updateSelector);
	}
}
