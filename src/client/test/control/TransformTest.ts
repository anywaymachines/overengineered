import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import { ButtonControl } from "client/gui/controls/Button";
import { ControlTest } from "./ControlTest";

export const TransformTest: ControlTest = {
	createTests() {
		const newbtn = (text: string, y: number): TextButton => {
			return Element.create("TextButton", {
				Size: new UDim2(0, 200, 0, 30),
				Position: new UDim2(0, 0, 0, 30 * y),
				Text: text,
			});
		};

		const list = new Control(Element.create("Frame", { Size: new UDim2(0, 200, 1, 0), Transparency: 1 }));

		{
			const tweenable = newbtn("instant transparency", 0);
			const component = list.add(new ButtonControl(tweenable));
			component.enable();
			component.activated.Connect(() =>
				component
					.transform()
					.run((t) => t.func(() => (tweenable.Transparency = 0)).transform("Transparency", 0.9)),
			);
		}

		{
			const tweenable = newbtn("transparency over 1sec", 1);
			const component = list.add(new ButtonControl(tweenable));
			component.enable();
			component.activated.Connect(() =>
				component
					.transform()
					.run((t) =>
						t.save("Transparency").transform("Transparency", 0.9, { duration: 1 }).then().restore(),
					),
			);
		}

		{
			const tweenable = newbtn("transparency over 1sec after 1sec", 2);
			const component = list.add(new ButtonControl(tweenable));
			component.enable();
			component.activated.Connect(() =>
				component
					.transform()
					.run((t) =>
						t.save("Transparency").wait(1).transform("Transparency", 0.9, { duration: 1 }).then().restore(),
					),
			);
		}

		{
			const tweenable = newbtn("multiple", 3);
			tweenable.Position = tweenable.Position.add(
				new UDim2(0, tweenable.Size.X.Offset / 2, 0, tweenable.Size.Y.Offset / 2),
			);
			tweenable.AnchorPoint = new Vector2(0.5, 0.5);

			const component = list.add(new ButtonControl(tweenable));
			component.enable();

			component.activated.Connect(() => {
				const anim = 1 as number;
				if (anim === 0) {
					component.transform().run((transform, instance) =>
						transform
							.save("Transparency")
							.func(() => (instance.Transparency = 0))
							.wait(1)
							.transform("Transparency", 0.9, { duration: 1 })
							.transform("Size", new UDim2(0, 80, 0, 10), { duration: 1 })
							.then()
							.transform("Transparency", 0, { duration: 1 })
							.transform("Size", new UDim2(0, 100, 0, 30), { duration: 1 })
							.then()
							.restore(),
					);
				} else if (anim === 1) {
					component.transform().run((transform, instance) =>
						transform.parallel(
							(transform) =>
								transform
									.func(() => (instance.Transparency = 0))
									.save("Position", "Size")
									.resizeRelative(new UDim2(0, -4, 0, -4), { duration: 0.05 })
									.moveRelative(new UDim2(0, -5, 0, 0), { duration: 0.1 })
									.then()
									.moveRelative(new UDim2(0, 10, 0, 0), { duration: 0.1 })
									.then()
									.moveRelative(new UDim2(0, -10, 0, 0), { duration: 0.1 })
									.then()
									.moveRelative(new UDim2(0, 10, 0, 0), { duration: 0.1 })
									.then()
									.moveRelative(new UDim2(0, -5, 0, 0), { duration: 0.1 })
									.resizeRelative(new UDim2(0, 4, 0, 4), { duration: 0.05 })
									.then()
									.restore(),
							(transform) =>
								transform.repeat(4, (transform) =>
									transform
										.func(() => (instance.BackgroundColor3 = Color3.fromHSV(0, 1, 1)))
										.transform("BackgroundColor3", Color3.fromHSV(0.33, 1, 1), {
											duration: 0.33,
											style: "Linear",
										})
										.then()
										.transform("BackgroundColor3", Color3.fromHSV(0.66, 1, 1), {
											duration: 0.33,
											style: "Linear",
										})
										.then()
										.transform("BackgroundColor3", Color3.fromHSV(1, 1, 1), {
											duration: 0.34,
											style: "Linear",
										})
										.then(),
								),
						),
					);
				}
			});
		}

		{
			const tweenable = newbtn("flash color", 4);
			const component = list.add(new ButtonControl(tweenable));
			component.enable();
			component.activated.Connect(() =>
				component.transform().run((t) => t.flashColor(Color3.fromRGB(255, 0, 0))),
			);
		}

		{
			const tweenable = newbtn("flash position", 5);
			const component = list.add(new ButtonControl(tweenable));
			component.enable();
			component.activated.Connect(() =>
				component.transform().run((t) => t.flash(new UDim2(0, 200, 0, 200), "Position")),
			);
		}

		return [["Transforms", list]];
	},
};
