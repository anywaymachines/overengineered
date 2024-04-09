import { Assert } from "shared/Assert";
import { ComponentDisabler } from "shared/component/ComponentDisabler";

export namespace ComponentDisablerTests {
	const { test, expect } = Assert.Testing;

	export function test1() {
		const allItems = ["item1", "item2", "item3"] as const;
		const disabler = new ComponentDisabler(allItems);

		test("should initialize with all items enabled", () => {
			expect(disabler.enabled.get()).toEqual(allItems);
			expect(disabler.disabled.get()).toEqual([]);
		});

		test("should correctly report if an item is enabled or disabled", () => {
			expect(disabler.isEnabled("item1")).toBe(true);
			expect(disabler.isDisabled("item1")).toBe(false);
		});

		test("should enable and disable all items", () => {
			disabler.disableAll();
			expect(disabler.enabled.get()).toEqual([]);
			expect(disabler.disabled.get()).toEqual(allItems);

			disabler.enableAll();
			expect(disabler.enabled.get()).toEqual(allItems);
			expect(disabler.disabled.get()).toEqual([]);
		});

		test("should enable and disable specific items", () => {
			disabler.disable("item1");
			expect(disabler.enabled.get()).toEqual(["item2", "item3"]);
			expect(disabler.disabled.get()).toEqual(["item1"]);

			disabler.enable("item1");
			expect(disabler.enabled.get()).toEqual(allItems);
			expect(disabler.disabled.get()).toEqual([]);
		});

		test("should enable and disable only specific items", () => {
			disabler.enableOnly("item1");
			expect(disabler.enabled.get()).toEqual(["item1"]);
			expect(disabler.disabled.get()).toEqual(["item2", "item3"]);

			disabler.disableOnly("item1");
			expect(disabler.enabled.get()).toEqual(["item2", "item3"]);
			expect(disabler.disabled.get()).toEqual(["item1"]);
		});

		test("should set enabled and disabled items", () => {
			disabler.setEnabled("item1", "item2");
			expect(disabler.enabled.get()).toEqual(["item1", "item2"]);
			expect(disabler.disabled.get()).toEqual(["item3"]);

			disabler.setDisabled("item1", "item2");
			expect(disabler.enabled.get()).toEqual(["item3"]);
			expect(disabler.disabled.get()).toEqual(["item1", "item2"]);
		});
	}
}
