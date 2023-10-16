export default abstract class Category {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	public abstract getDisplayName(): string;

	public abstract getIcon(): string;

	public hasAccess(): boolean {
		return true;
	}
}
