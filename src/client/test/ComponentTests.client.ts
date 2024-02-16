import { RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import InstanceComponent from "shared/component/SharedComponent";
import ComponentBase from "shared/component/SharedComponentBase";
import ContainerComponent from "shared/component/SharedComponentContainer";
import Objects from "shared/fixes/objects";

if (!RunService.IsStudio()) new Signal().Wait();

const myassert = (part: boolean, message?: string) => {
	if (part) return;

	if (message !== undefined) {
		throw `Assertion failed: ${message}`;
	}

	throw "Assertion failed";
};

const tests = {
	componentDestroyByInstance: () => {
		const part = new Instance("Part");
		const component = new InstanceComponent(part);
		component.enable();
		part.Destroy();

		myassert(component.isDestroyed());
	},
	componentDestroyInstanceBySelf: () => {
		const part = new Instance("Part");
		const component = new InstanceComponent(part);
		component.enable();
		component.destroy();

		myassert(!part.Parent);
	},

	children: () => {
		const component = new ContainerComponent();
		component.children.add(new ComponentBase());
		myassert(component.children.getAll().size() === 1, "Should not be empty after adding");
		myassert(!component.children.getAll().find((f) => f.isEnabled()), "Should not be enabled yet");

		component.enable();
		myassert(!component.children.getAll().find((f) => !f.isEnabled()), "Should all be enabled (1)");

		component.children.add(new ComponentBase());
		myassert(
			!component.children.getAll().find((f) => !f.isEnabled()),
			"Adding a component when already enabled should enable it",
		);

		component.disable();
		myassert(!component.children.getAll().find((f) => f.isEnabled()), "Should all be disabled");

		component.enable();
		myassert(!component.children.getAll().find((f) => !f.isEnabled()), "Should all be enabled (2)");

		component.destroy();
		myassert(component.children.getAll().size() === 0, "Should be no children left after destroying");
	},
} as const;

print("--- RUNNING COMPONENT TESTS ---");
for (const [key, value] of Objects.pairs(tests)) {
	print(`--- Running test ${key} ---`);
	value();
}
print("--- COMPONENT TESTS COMPLETED ---");
