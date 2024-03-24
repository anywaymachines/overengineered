import { Assert } from "shared/Assert";
import { Element } from "shared/Element";
import { Component } from "shared/component/Component";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { InstanceComponent } from "shared/component/InstanceComponent";

export const ComponentTests = {
	componentDestroyByInstance: () => {
		const part = Element.create("Part");
		const component = new InstanceComponent(part);
		component.enable();
		part.Destroy();

		Assert.true(component.isDestroyed());
	},
	componentDestroyByParentInstance: () => {
		const parent = Element.create("Part", {}, { child: Element.create("Part") });
		const component = new InstanceComponent(parent.child);
		component.enable();
		parent.Destroy();

		Assert.true(component.isDestroyed());
	},
	componentDestroyInstanceBySelf: () => {
		const part = Element.create("Part");
		const component = new InstanceComponent(part);
		component.enable();
		component.destroy();

		Assert.true(!part.Parent);
	},

	children: () => {
		const component = new ContainerComponent();
		component.children.add(new Component());
		Assert.true(component.children.getAll().size() === 1, "Should not be empty after adding");
		Assert.true(!component.children.getAll().find((f) => f.isEnabled()), "Should not be enabled yet");

		component.enable();
		Assert.true(!component.children.getAll().find((f) => !f.isEnabled()), "Should all be enabled (1)");

		component.children.add(new Component());
		Assert.true(
			!component.children.getAll().find((f) => !f.isEnabled()),
			"Adding a component when already enabled should enable it",
		);

		component.disable();
		Assert.true(!component.children.getAll().find((f) => f.isEnabled()), "Should all be disabled");

		component.enable();
		Assert.true(!component.children.getAll().find((f) => !f.isEnabled()), "Should all be enabled (2)");

		component.destroy();
		Assert.true(component.children.getAll().size() === 0, "Should be no children left after destroying");
	},
} as const;
