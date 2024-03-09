import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import Signals from "client/event/Signals";
import { Component } from "shared/component/Component";
import { ComponentChild } from "shared/component/ComponentChild";
import ObservableValue from "shared/event/ObservableValue";
import HoveredBlockHighlighter from "./HoveredBlockHighlighter";
import { MultiModelHighlighter } from "./MultiModelHighlighter";

export class HoveredBlocksHighlighter extends ClientComponent {
	private readonly _highlighted = new ObservableValue<readonly BlockModel[]>([]);
	readonly highlighted = this._highlighted.asReadonly();

	constructor(parent: Instance, getTargets: (block: BlockModel) => readonly BlockModel[]) {
		super();

		interface Highlighter extends IComponent {
			highlight(models: readonly BlockModel[]): void;
			stop(): void;
		}

		const highlighterParent = new ComponentChild<Highlighter>(this, true);

		this.onPrepare((inputType) => {
			if (inputType === "Touch") {
				class EmptyHighlighter extends Component implements Highlighter {
					highlight() {}
					stop() {}
				}

				highlighterParent.set(new EmptyHighlighter());
			} else {
				highlighterParent.set(new MultiModelHighlighter(parent));
			}

			highlighterParent.get()?.highlight(this.highlighted.get());
		});

		const mouse = Players.LocalPlayer.GetMouse();
		let prevTarget: Instance | undefined;

		const destroyHighlight = () => {
			prevTarget = undefined;
			highlighterParent.get()?.stop();
			this._highlighted.set([]);
		};

		/** @param forceUpdate If true, don't check for `target === prevTarget`. Useful for updating on pressing Ctrl, since the targeted block did not change but the update is nesessary */
		const updateTarget = (forceUpdate: boolean) => {
			const target = HoveredBlockHighlighter.getTargetedBlock(mouse);
			if (!target) {
				destroyHighlight();
				return;
			}

			if (!forceUpdate && target === prevTarget) {
				return;
			}
			prevTarget = target;

			const targets = getTargets(target);
			highlighterParent.get()?.highlight(targets);
			this._highlighted.set(targets);
		};

		const prepare = () => {
			this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => updateTarget(false));
			this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => updateTarget(false));
			this.inputHandler.onInputBegan(() => updateTarget(true));
			this.inputHandler.onInputChanged(() => updateTarget(false));
			this.inputHandler.onInputEnded(() => updateTarget(true));

			updateTarget(true);
		};

		this.onEnable(prepare);
		this.onDisable(destroyHighlight);
	}
}
