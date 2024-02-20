import { Assert } from "client/test/Assert";
import InstanceComponent from "shared/component/SharedComponent";
import ComponentBase from "shared/component/SharedComponentBase";
import ContainerComponent from "shared/component/SharedComponentContainer";

export const ComponentTests = {
	componentDestroyByInstance: () => {
		const part = new Instance("Part");
		const component = new InstanceComponent(part);
		component.enable();
		part.Destroy();

		Assert.true(component.isDestroyed());
	},
	componentDestroyInstanceBySelf: () => {
		const part = new Instance("Part");
		const component = new InstanceComponent(part);
		component.enable();
		component.destroy();

		Assert.true(!part.Parent);
	},

	children: () => {
		const component = new ContainerComponent();
		component.children.add(new ComponentBase());
		Assert.true(component.children.getAll().size() === 1, "Should not be empty after adding");
		Assert.true(!component.children.getAll().find((f) => f.isEnabled()), "Should not be enabled yet");

		component.enable();
		Assert.true(!component.children.getAll().find((f) => !f.isEnabled()), "Should all be enabled (1)");

		component.children.add(new ComponentBase());
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
