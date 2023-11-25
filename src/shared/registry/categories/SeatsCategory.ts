import AbstractCategory from "../abstract/AbstractCategory";

export default class SeatsCategory extends AbstractCategory {
	constructor() {
		super("seats");
	}

	public getDisplayName(): string {
		return "Seats";
	}
}
