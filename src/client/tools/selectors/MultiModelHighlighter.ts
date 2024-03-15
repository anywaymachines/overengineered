import { Element } from "shared/Element";
import { Component } from "shared/component/Component";

/** Highlights multiple {@link PVInstance}s by putting them in a single {@link Model} */
export class MultiModelHighlighter extends Component {
	private readonly model: Model;
	private readonly highlightInstance: Highlight;
	private highlighted?: ReadonlyMap<PVInstance, Instance | undefined>;

	constructor(modelParent: Instance, modifyFunc?: (highlight: Highlight) => void) {
		super();

		this.model = Element.create("Model", { Name: "MultiHighlighter", Parent: modelParent });
		this.highlightInstance = Element.create("Highlight", {
			FillTransparency: 0.4,
			OutlineTransparency: 0.5,
			DepthMode: Enum.HighlightDepthMode.Occluded,
			Parent: this.model,
		});
		modifyFunc?.(this.highlightInstance);

		this.onDisable(() => this.stop());
		this.onDestroy(() => {
			this.highlightInstance.Destroy();
			this.model.Destroy();
		});
	}

	highlight(instances: readonly PVInstance[]) {
		this.stop();

		const children = new Map(instances.map((i) => [i, i.Parent]));
		for (const [instance] of children) {
			instance.Parent = this.model;
		}

		this.highlightInstance.Adornee = this.model;
		this.highlighted = children;
	}
	stop() {
		if (!this.highlighted) return;

		this.highlightInstance.Adornee = undefined;
		for (const [instance, parent] of this.highlighted) {
			instance.Parent = parent;
		}

		this.highlighted = undefined;
	}
}
