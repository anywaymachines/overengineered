export namespace LocalInstanceData {
	const instanceTags = new Map<Instance, string[]>();

	function PrepareCleanupLogic(instance: Instance) {
		// Cleanup
		instance.Destroying.Once(() => instanceTags.delete(instance));
		instance.GetPropertyChangedSignal("Parent").Connect(() => {
			if (!instance) {
				instanceTags.delete(instance);
			}
		});
	}

	export function AddLocalTag(instance: Instance, tag: string) {
		const currentTags = instanceTags.has(instance) ? instanceTags.get(instance)! : [];
		currentTags.push(tag);
		instanceTags.set(instance, currentTags);

		PrepareCleanupLogic(instance);
	}

	export function HasLocalTag(instance: Instance, tag: string) {
		if (!instanceTags.has(instance)) return false;

		const currentTags = instanceTags.get(instance)!;
		return currentTags.includes(tag);
	}

	export function RemoveLocalTag(instance: Instance, tag: string) {
		if (!instanceTags.has(instance)) return;

		const currentTags = instanceTags.get(instance)!;
		currentTags.remove(currentTags.indexOf(tag));
		instanceTags.set(instance, currentTags);
	}

	export function GetAllLocalTags(instance: Instance) {
		if (!instanceTags.has(instance)) return [];

		const currentTags = instanceTags.get(instance)!;
		return currentTags;
	}
}
