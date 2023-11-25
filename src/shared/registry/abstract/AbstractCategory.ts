export default abstract class AbstractCategory {
	public readonly id: string;

	constructor(id: string) {
		this.id = id;
	}

	/** Must return the **displayed** name of the category */
	public abstract getDisplayName(): string;
}
