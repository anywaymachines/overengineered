import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { TransformProps } from "shared/component/Transform";
import { TransformService } from "shared/component/TransformService";
import { ObservableValue } from "shared/event/ObservableValue";

class LoadingImage extends Control {
	runShowAnimation() {
		const startanim = () => {
			if (!this.isEnabled()) return;

			this.transform((transform, instance) =>
				transform
					.transform("Rotation", instance.Rotation + 90, {
						duration: 0.8,
						style: "Quad",
						direction: "InOut",
					})
					.then()
					.func(startanim),
			);
		};

		this.cancelTransforms();
		this.transform((transform, instance) =>
			transform
				.then()
				.transform("Rotation", () => instance.Rotation + 270, {
					duration: 0.3,
					style: "Quad",
					direction: "Out",
				})
				.then()
				.func(startanim),
		);
	}
	runHideAnimation() {
		this.disable();

		TransformService.cancel(this.instance);
		this.transform((transform, instance) =>
			transform.then().transform("Rotation", () => instance.Rotation - 270, {
				duration: 0.3,
				style: "Quad",
				direction: "In",
			}),
		);
	}
}

type LoadingPopupDefinition = GuiObject & {
	readonly LoadingImage: GuiObject;
	readonly TextLabel: TextLabel;
};
class LoadingPopup extends Control<LoadingPopupDefinition> {
	private readonly loadingImage;

	constructor(gui: LoadingPopupDefinition) {
		super(gui);
		this.loadingImage = this.add(new LoadingImage(gui.LoadingImage));
	}

	show(): void {
		if (this.isEnabled()) {
			return;
		}

		super.show();
		this.cancelTransforms();

		this.loadingImage.runShowAnimation();
		const params: TransformProps = {
			duration: 0.3,
			style: "Quad",
			direction: "Out",
		};
		this.transform((tr) => tr.moveY(new UDim(0, 80), params));
	}
	hide(): void {
		const params: TransformProps = {
			duration: 0.4,
			style: "Quad",
			direction: "In",
		};

		this.loadingImage.runHideAnimation();
		this.cancelTransforms();
		this.transform((tr) =>
			tr
				.moveY(new UDim(0, -200), params)
				.then()
				.func(() => super.hide()),
		);
	}

	setText(text: string) {
		this.gui.TextLabel.Text = text;
	}
}

const control = new LoadingPopup(Gui.getGameUI<{ Loading: LoadingPopupDefinition }>().Loading);
control.hide();

const state = new ObservableValue<boolean>(false);
export namespace LoadingController {
	export const isLoading = state.asReadonly();

	export function show(text: string) {
		control.setText(`${text}...`);
		control.show();
		state.set(true);
	}
	export function hide() {
		control.hide();
		state.set(false);
	}

	export async function runAsync<T>(text: string, func: () => T | Promise<T>) {
		try {
			LoadingController.show(text);
			return await func();
		} finally {
			LoadingController.hide();
		}
	}
}
