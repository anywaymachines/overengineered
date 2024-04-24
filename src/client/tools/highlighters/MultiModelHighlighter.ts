import { Workspace } from "@rbxts/services";
import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { Element } from "shared/Element";
import { Component } from "shared/component/Component";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

const globalModel = Element.create("Model", { Name: "MultiHighlighterGlobal", Parent: Workspace });
const globalHighlightInstance = BlockGhoster.createHighlight({ Parent: globalModel });

/** Highlights multiple {@link PVInstance}s by cloning them and putting them in a single {@link Model} */
export class MultiModelHighlighter extends Component {
	private readonly model: Model;
	private readonly highlightInstance: Highlight;
	private highlighted?: readonly PVInstance[];

	constructor(
		modelParent: Instance,
		instances: ReadonlyObservableValue<readonly PVInstance[]>,
		modifyFunc?: (highlight: Highlight) => void,
	) {
		super();

		if (modifyFunc) {
			this.model = Element.create("Model", { Name: "MultiHighlighter", Parent: modelParent });
			this.highlightInstance = BlockGhoster.createHighlight({ Parent: this.model });
			modifyFunc(this.highlightInstance);
		} else {
			this.model = globalModel;
			this.highlightInstance = globalHighlightInstance;
		}

		const highlight = (instances: readonly PVInstance[]) => {
			stop();
			if (instances.size() === 0) return;

			const cloned = instances.map((i) => i.Clone());
			for (const instance of cloned) {
				instance.Parent = this.model;
			}

			this.highlightInstance.Adornee = this.model;
			this.highlighted = cloned;
		};
		const stop = () => {
			if (!this.highlighted) return;

			this.highlightInstance.Adornee = undefined;
			for (const instance of this.highlighted) {
				instance.Destroy();
			}

			this.highlighted = undefined;
		};

		this.event.subscribeObservable(instances, highlight, true);
		this.onDisable(stop);
		this.onDestroy(() => {
			if (this.model !== globalModel) {
				this.model.Destroy();
			}
		});
	}
}
