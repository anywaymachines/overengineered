export default class LocalInstanceData {
	private static readonly instanceTags: Map<Instance, string[]> = new Map();

	private static PrepareCleanupLogic(instance: Instance) {
		// Cleanup
		instance.Destroying.Once(() => this.instanceTags.delete(instance));
		instance.GetPropertyChangedSignal("Parent").Connect(() => {
			if (!instance) {
				this.instanceTags.delete(instance);
			}
		});
	}

	static AddLocalTag(instance: Instance, tag: string) {
		const currentTags = this.instanceTags.has(instance) ? this.instanceTags.get(instance)! : [];
		currentTags.push(tag);
		this.instanceTags.set(instance, currentTags);

		this.PrepareCleanupLogic(instance);
	}

	static HasLocalTag(instance: Instance, tag: string) {
		if (!this.instanceTags.has(instance)) return false;

		const currentTags = this.instanceTags.get(instance)!;
		return currentTags.includes(tag);
	}

	static RemoveLocalTag(instance: Instance, tag: string) {
		if (!this.instanceTags.has(instance)) return;

		const currentTags = this.instanceTags.get(instance)!;
		currentTags.remove(currentTags.indexOf(tag));
		this.instanceTags.set(instance, currentTags);
	}

	static GetAllLocalTags(instance: Instance) {
		if (!this.instanceTags.has(instance)) return [];

		const currentTags = this.instanceTags.get(instance)!;
		return currentTags;
	}
}
