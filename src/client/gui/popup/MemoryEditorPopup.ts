import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";
import { ByteTextBoxControl } from "client/gui/controls/ByteTextBoxControl";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { TextPopup } from "client/gui/popup/TextPopup";
import { LogControl } from "client/gui/static/LogControl";
import { Colors } from "shared/Colors";
import { TransformService } from "shared/component/TransformService";
import { VectorUtils } from "shared/utils/VectorUtils";

export type MemoryEditorPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly AddressTextBox: TextBox;
	readonly ImportButton: TextButton;
	readonly ClearButton: TextButton;
	readonly Content: MemoryEditorRecordsDefinition;
};

export type MemoryEditorRecordDefinition = Frame & {
	readonly b0: TextBox;
	readonly b1: TextBox;
	readonly b2: TextBox;
	readonly b3: TextBox;
	readonly b4: TextBox;
	readonly b5: TextBox;
	readonly b6: TextBox;
	readonly b7: TextBox;
	readonly b8: TextBox;
	readonly b9: TextBox;
	readonly b10: TextBox;
	readonly b11: TextBox;
	readonly b12: TextBox;
	readonly b13: TextBox;
	readonly b14: TextBox;
	readonly b15: TextBox;
	readonly AddressLabel: TextLabel;
	readonly AsciiLabel: TextLabel;
};

export type MemoryEditorRecordsDefinition = ScrollingFrame & {
	Template: MemoryEditorRecordDefinition;
};

class MemoryEditorRow extends Control<MemoryEditorRecordDefinition, ByteTextBoxControl> {
	constructor(
		gui: MemoryEditorRecordDefinition,
		private readonly address: number,
		private readonly data: number[],
		recolorPreviousUntil: (index: number) => void,
	) {
		super(gui);

		this.gui.AddressLabel.Text = string.format("0x%04X", address * 16);

		const updateAsciiLabel = () => {
			let str = "";
			for (let i = 0; i < 16; i++) {
				const c = data[address * 16 + i] ?? 0;
				str += c >= 32 && c <= 126 ? string.char(c) : ".";
			}

			this.gui.AsciiLabel.Text = str;
		};
		updateAsciiLabel();

		for (let i = 0; i < 16; i++) {
			const tb = this.gui.WaitForChild(`b${i}`) as TextBox;

			tb.TextColor3 = data[address * 16 + i] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);

			const idx = i;
			const control = this.add(new ByteTextBoxControl(tb));
			control.value.set(data[address * 16 + i] ?? 0);
			control.submitted.Connect((value) => {
				tb.TextColor3 = Colors.white;

				for (let j = 0; j < address * 16 + i; j++) {
					data[j] ??= 0;
				}

				data[address * 16 + i] = value;
				recolorPreviousUntil(address * 16 + idx);
				updateAsciiLabel();
			});
		}
	}

	updateColor(index: number) {
		this.getChildren()[index].instance.TextColor3 =
			this.data[this.address * 16 + index] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);
	}
}

class MemoryEditorRows extends Control<MemoryEditorRecordsDefinition> {
	private readonly template;
	private readonly rows;

	cursor = 0;
	private readonly contentSize = 80;

	constructor(
		gui: MemoryEditorRecordsDefinition,
		scaler: { getScale(): number },
		private readonly limit: number,
		private readonly data: number[],
	) {
		super(gui);

		this.template = this.asTemplate(this.gui.Template, false);
		this.gui.Template.Visible = false;

		this.rows = new Control<GuiObject, MemoryEditorRow>(this.gui);
		this.add(this.rows);

		this.gui.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const onStart = VectorUtils.roundVector2(this.gui.CanvasPosition).Y === 0;
			const endReached =
				VectorUtils.roundVector2(this.gui.AbsoluteCanvasSize.sub(this.gui.CanvasPosition)).Y ===
				VectorUtils.roundVector2(this.gui.AbsoluteSize).Y;

			if (onStart) {
				loadBehind();
			}

			if (endReached) {
				loadBelow();
			}
		});

		const loadBehind = () => {
			if (this.cursor <= 0) return;
			this.cursor -= this.contentSize / 4;
			if (this.cursor < 0) this.cursor = 0;

			this.recreate();
			const scale = scaler.getScale();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.add(
				new Vector2(0, this.gui.Template.Size.Y.Offset * (this.contentSize / 4) * scale),
			);
		};

		const loadBelow = () => {
			if (this.cursor >= limit) return;
			this.cursor += this.contentSize / 4;

			this.recreate();
			const scale = scaler.getScale();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.sub(
				new Vector2(0, this.gui.Template.Size.Y.Offset * (this.contentSize / 4) * scale),
			);
		};

		this.recreate();
	}

	recreate() {
		this.rows.clear();

		for (let i = 0; i < this.contentSize; i++) {
			const address = i + this.cursor;
			if (address > this.limit) break;

			const children = this.rows.getChildren();
			this.rows.add(
				new MemoryEditorRow(this.template(), address, this.data, (index) => {
					for (let i = 0; i < math.ceil(index / 16) + 2; i++) {
						for (let j = 0; j < 16; j++) {
							children[i].updateColor(j);
						}
					}
				}),
			);
		}
	}
}

export class MemoryEditorPopup extends Popup<MemoryEditorPopupDefinition> {
	static showPopup(limit: number, data: number[], callback: (data: number[]) => void) {
		const popup = new MemoryEditorPopup(
			Gui.getGameUI<{
				Popup: {
					MemoryEditor: MemoryEditorPopupDefinition;
				};
			}>().Popup.MemoryEditor.Clone(),
			limit,
			data,
			callback,
		);

		popup.show();
	}

	constructor(gui: MemoryEditorPopupDefinition, limit: number, data: number[], callback: (data: number[]) => void) {
		super(gui);

		const rows = this.add(new MemoryEditorRows(this.gui.Content, this.parentScreen, limit, data));

		this.gui.Content.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const scale = this.parentScreen.getScale();
			const currentRow =
				rows.cursor +
				math.round(this.gui.Content.CanvasPosition.Y / (this.gui.Content.Template.Size.Y.Offset * scale));
			const currentAddress = currentRow * 16;

			this.gui.AddressTextBox.Text = `${currentAddress}`;
		});

		this.add(
			new ButtonControl(this.gui.Heading.CloseButton, () => {
				this.hide();
				callback(data);
			}),
		);

		this.add(
			new ButtonControl(this.gui.ClearButton, () => {
				ConfirmPopup.showPopup(
					"Clear memory store?",
					"It will be impossible to undo this action",
					() => {
						data.clear();
						rows.recreate();
					},
					() => {},
				);
			}),
		);

		this.add(
			new ButtonControl(this.gui.ImportButton, () => {
				TextPopup.showPopup(
					"IMPORT",
					"00 01 02 03 04 ...",
					(text) => {
						const spacelessText = string.gsub(text, "%s+", "")[0];

						if (spacelessText.size() % 2 !== 0 || string.match(text, "^[0-9a-fA-F%s]+$")[0] === undefined) {
							LogControl.instance.addLine("Invalid data format!", Colors.red);
							return;
						}

						data.clear();
						for (const [value] of spacelessText.gmatch("%S%S")) {
							data.push(tonumber(value, 16)!);
						}

						rows.recreate();

						LogControl.instance.addLine("Import successful!");
					},
					() => {},
				);
			}),
		);

		// const search = this.add(new TextBoxControl(gui.Search));
		// this.event.subscribeObservable(search.text, (text) => slots.search.set(text), true);
	}

	show() {
		super.show();
		TransformService.run(this.instance, (transform) => transform.slideIn("top", 50, { duration: 0.2 }));
	}
}
