/**
 * A service that is responsible for managing local instance tags without replicating them
 */
export namespace LocalInstanceData {
	const instanceTags = new Map<Instance, Set<string>>();

	/** A function that adds a new tag to an instance
	 * @param instance Instance
	 * @param tag Tag
	 */
	export function AddLocalTag(instance: Instance, tag: string) {
		const currentTags = instanceTags.has(instance) ? instanceTags.get(instance)! : new Set<string>()
		currentTags.add(tag);
		instanceTags.set(instance, currentTags);

		// Cleanup logic
		instance.Destroying.Once(() => instanceTags.delete(instance));
		instance.GetPropertyChangedSignal("Parent").Connect(() => {
			if (!instance.Parent) {
				instanceTags.delete(instance);
			}
		});
	}

	/** A function that cheecks is tag exists in instance
	 * @param instance Instance
	 * @param tag Tag
	 */
	export function HasLocalTag(instance: Instance, tag: string) {
		if (!instanceTags.has(instance)) return false;

		const currentTags = instanceTags.get(instance)!;
		return currentTags.has(tag);
	}

	/** A function that removes a tag from instance
	 * @param instance Instance
	 * @param tag Tag
	 */
	export function RemoveLocalTag(instance: Instance, tag: string) {
		if (!instanceTags.has(instance)) return;

		const currentTags = instanceTags.get(instance)!;
		currentTags.delete(tag);
		instanceTags.set(instance, currentTags);
	}

	/** A function that reurns all tags in instance
	 * @param instance Instance
	 */
	export function GetAllLocalTags(instance: Instance) {
		if (!instanceTags.has(instance)) return [];

		const currentTags = instanceTags.get(instance)!;
		return currentTags.map((item) => item);
	}
}
