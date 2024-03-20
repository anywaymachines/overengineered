import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { TransformProps } from "shared/component/Transform";
import ObservableValue from "shared/event/ObservableValue";

class LoadingImage extends Control {
	constructor(gui: GuiObject) {
		super(gui);

		const startanim = () => {
			if (!this.isEnabled()) return;

			this.runTransform(this.gui, (transform, instance) =>
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
		this.onEnable(() => (gui.Rotation = 0));
		this.onEnable(startanim);
	}
}

type LoadingPopupDefinition = GuiObject & {
	readonly LoadingImage: GuiObject;
	readonly TextLabel: TextLabel;
};
class LoadingPopup extends Control<LoadingPopupDefinition> {
	constructor(gui: LoadingPopupDefinition) {
		super(gui);
		this.add(new LoadingImage(gui.LoadingImage));
	}

	show(): void {
		super.show();

		const params: TransformProps = {
			duration: 0.3,
			style: "Quad",
			direction: "Out",
		};
		this.runTransform(this.gui, (tr) => tr.moveY(new UDim(0, 80), params));
	}
	hide(): void {
		const params: TransformProps = {
			duration: 0.3,
			style: "Quad",
			direction: "Out",
		};
		this.runTransform(this.gui, (tr) =>
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
export const LoadingController = {
	isLoading: state.asReadonly(),

	show: (text: string) => {
		control.setText(`${text}...`);
		control.show();
		state.set(true);
	},
	hide: () => {
		control.hide();
		state.set(false);
	},
} as const;
