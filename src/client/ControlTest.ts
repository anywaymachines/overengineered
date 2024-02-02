import { StarterGui } from "@rbxts/services";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import Control from "./base/Control";
import { ButtonControl } from "./gui/controls/Button";

const createElement = <T extends keyof CreatableInstances, const TChildren extends Readonly<Record<string, Instance>>>(
	instanceType: T,
	properties?: Partial<ExcludeMembers<CreatableInstances[T], "Name">>,
	children?: TChildren,
): CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] } => {
	const instance = new Instance(instanceType);

	if (properties !== undefined) {
		Objects.assign(instance, properties);
	}

	if (children) {
		for (const [name, child] of Objects.pairs(children)) {
			child.Name = name as string;
			child.Parent = instance;
		}
	}

	return instance as CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] };
};

const newFont = (font: Enum.Font, weight: Enum.FontWeight) => {
	const f = Font.fromEnum(font);
	f.Weight = weight;

	return f;
};

const gameui = StarterGui.WaitForChild("GameUI") as ScreenGui;
gameui.FindFirstChild("AutoCreated")?.Destroy();

const parent = createElement("Frame", {
	Name: "AutoCreated",
	Parent: gameui,
	Size: new UDim2(1, 0, 1, 0),
	Transparency: 1,
});

type WindowDefinition = ReturnType<typeof Window.createGui>;
class Window extends Control<WindowDefinition> {
	readonly title = new ObservableValue("Title");
	private readonly contentsContainer;

	constructor(gui: WindowDefinition) {
		super(gui);

		this.contentsContainer = this.added(new Control(this.gui.Contents));

		this.event.subscribeObservable(this.title, (value) => (this.gui.Titlebar.Title.Text = value.upper()), true);

		this.event.subscribeObservable(
			this.event.observableFromGuiParam(this.gui, "AbsoluteSize"),
			(size) => {
				this.gui.Contents.Size = new UDim2(1, 0, 1 - this.gui.Titlebar.Size.Y.Scale, 0);
			},
			true,
		);
	}

	setContents(contents: Control) {
		this.contentsContainer.clear();
		this.contentsContainer.add(contents);
	}

	static createGui() {
		const title = createElement(
			"Frame",
			{
				Name: "Window",
				AnchorPoint: new Vector2(0, 0.5),
				BackgroundColor3: new Color3(0.1725490242242813, 0.1882352977991104, 0.239215686917305),
				BorderColor3: new Color3(0, 0, 0),
				BorderSizePixel: 0,
				Size: new UDim2(new UDim(1, 0), new UDim(0.13, 0)),
				SizeConstraint: Enum.SizeConstraint.RelativeXX,
			},
			{
				UICorner: createElement("UICorner", { CornerRadius: new UDim(0.2, 0) }),
				Title: createElement("TextLabel", {
					AnchorPoint: new Vector2(0.5, 0.5),
					BackgroundColor3: new Color3(1, 1, 1),
					BackgroundTransparency: 1,
					BorderColor3: new Color3(0, 0, 0),
					BorderSizePixel: 0,
					Position: new UDim2(new UDim(0.5, 0), new UDim(0.5, 0)),
					Size: new UDim2(new UDim(1, 0), new UDim(0.8, 0)),
					Text: "TITLE",
					TextColor3: new Color3(1, 1, 1),
					TextScaled: true,
					TextSize: 35,
					TextWrapped: true,
					FontFace: newFont(Enum.Font.Ubuntu, Enum.FontWeight.Bold),
				}),
			},
		);

		const body = createElement(
			"Frame",
			{
				AnchorPoint: new Vector2(0, 0.5),
				BackgroundColor3: new Color3(0.125490203499794, 0.14509804546833038, 0.1921568661928177),
				BorderColor3: new Color3(0, 0, 0),
				BorderSizePixel: 0,
				Position: new UDim2(new UDim(0, 10), new UDim(0.5, 0)),
				Size: new UDim2(new UDim(0.3, 0), new UDim(0.35, 0)),
				SizeConstraint: Enum.SizeConstraint.RelativeYY,
			},
			{
				UICorner: createElement("UICorner", { CornerRadius: new UDim(0.05, 0) }),
				Titlebar: title,
				Contents: createElement("Frame", {
					Transparency: 1,
					Position: new UDim2(0, 0, 0.045, 0),
					Size: new UDim2(1, 0, 1, 0),
				}),
			},
		);

		return body;
	}
}

//
const createBlockSelection = () => {
	const window = new Window(Window.createGui());
	window.title.set("aboba");

	const scrollgui = createElement(
		"ScrollingFrame",
		{
			Active: true,
			AnchorPoint: new Vector2(0.5, 0),
			BackgroundColor3: new Color3(1, 1, 1),
			BackgroundTransparency: 1,
			BorderColor3: new Color3(0, 0, 0),
			BorderSizePixel: 0,
			Position: new UDim2(new UDim(0.5, 0), new UDim(0.08, 0)),
			Size: new UDim2(0.95, 0, 1, 0),
			ScrollBarThickness: 4,
			ScrollingDirection: Enum.ScrollingDirection.Y,
		},
		{
			Template: createElement(
				"TextButton",
				{
					BorderColor3: new Color3(0, 0, 0),
					BorderSizePixel: 0,
					Font: Enum.Font.SourceSans,
					Position: new UDim2(new UDim(0, 0), new UDim(0, 0)),
					Size: new UDim2(new UDim(0.95, 0), new UDim(0.15, 0)),
					Text: "",
					TextColor3: new Color3(0, 0, 0),
					TextSize: 14,
				},
				{
					UICorner: createElement("UICorner"),
					TextLabel: createElement("TextLabel", {
						BackgroundColor3: new Color3(1, 1, 1),
						BackgroundTransparency: 1,
						BorderColor3: new Color3(0, 0, 0),
						BorderSizePixel: 0,
						Font: Enum.Font.SourceSansBold,
						Position: new UDim2(new UDim(0, 0), new UDim(0.2, 0)),
						Size: new UDim2(new UDim(1, 0), new UDim(0.6, 0)),
						Text: "Wedge 2x1",
						TextColor3: new Color3(1, 1, 1),
						TextScaled: true,
						TextSize: 14,
						TextWrapped: true,
						FontFace: Font.fromEnum(Enum.Font.Ubuntu),
					}),
					Frame: createElement(
						"Frame",
						{
							BackgroundColor3: new Color3(0, 0, 0),
							BackgroundTransparency: 0.6,
							BorderColor3: new Color3(0, 0, 0),
							BorderSizePixel: 0,
							Size: new UDim2(new UDim(1, 0), new UDim(1, 0)),
						},
						{
							LockImage: createElement("ImageLabel", {
								Visible: false,
								AnchorPoint: new Vector2(1, 0.5),
								BackgroundColor3: new Color3(1, 1, 1),
								BackgroundTransparency: 1,
								BorderColor3: new Color3(0, 0, 0),
								BorderSizePixel: 0,
								Image: "rbxassetid://15428855911",
								Position: new UDim2(new UDim(1, 0), new UDim(0.5, 0)),
								ScaleType: Enum.ScaleType.Fit,
								Size: new UDim2(new UDim(0.127, 0), new UDim(0.5, 0)),
							}),
							UICorner: createElement("UICorner"),
						},
					),
				},
			),
			UIListLayout: createElement("UIListLayout", {
				Padding: new UDim(0.01, 0),
			}),
		},
	);

	const scroll = new Control(scrollgui);
	scroll.getGui().Parent = window.getGui().Contents;

	return window;
};

type ButtonStyle = "default" | "negative";
type WindowButtonControlDefinition = ReturnType<typeof WindowButtonControl.createGui>;
class WindowButtonControl extends ButtonControl<WindowButtonControlDefinition> {
	readonly text = new ObservableValue<string>("");
	readonly style = new ObservableValue<ButtonStyle>("default");

	constructor(gui: WindowButtonControlDefinition) {
		super(gui);

		this.event.subscribeObservable(this.text, (text) => (this.gui.TextLabel.Text = text), true);

		this.event.subscribeObservable(
			this.style,
			(style) => {
				//
			},
			true,
		);
	}

	static createGui() {
		//
		const btn = createElement(
			"TextButton",
			{
				//
			},
			{
				UICorner: createElement("UICorner", { CornerRadius: new UDim(0.1, 0) }),
				TextLabel: createElement("TextLabel", {}),
			},
		);

		return btn;
	}
}

const createPopup = () => {
	const window = new Window(Window.createGui());
	window.title.set("Confirmation");

	const confirmButton = new WindowButtonControl(WindowButtonControl.createGui());
	confirmButton.text.set("CONFIRM");

	const cancelButton = new WindowButtonControl(WindowButtonControl.createGui());
	cancelButton.style.set("negative");
	cancelButton.text.set("CANCEL");

	const contents = createElement(
		"Frame",
		{
			Transparency: 1,
			Size: new UDim2(1, 0, 1, 0),
		},
		{
			/*TextButton: createElement(
				"TextButton",
				{
					AnchorPoint: new Vector2(1, 1),
					BorderColor3: Color3.fromRGB(0, 0, 0),
					BorderSizePixel: 0,
					Font: Enum.Font.SourceSans,
					Position: new UDim2(new UDim(1, 0), new UDim(1, 0)),
					Size: new UDim2(new UDim(0.475, 0), new UDim(0.18, 0)),
					Text: "",
					TextColor3: Color3.fromRGB(255, 255, 255),
					TextSize: 1,
					TextWrapped: true,
				},
				{
					UICorner: createElement("UICorner"),
					TextLabel: createElement("TextLabel", {
						AnchorPoint: new Vector2(0.5, 0.5),
						BackgroundColor3: Color3.fromRGB(255, 255, 255),
						BackgroundTransparency: 1,
						BorderColor3: Color3.fromRGB(0, 0, 0),
						BorderSizePixel: 0,
						Font: Enum.Font.SourceSansBold,
						Position: new UDim2(new UDim(0.5, 0), new UDim(0.5, 0)),
						Size: new UDim2(new UDim(1, 0), new UDim(0.6, 0)),
						Text: "CONFIRM",
						TextColor3: Color3.fromRGB(255, 255, 255),
						TextScaled: true,
						TextSize: 14,
						TextWrapped: true,
					}),
				},
			),*/
			TextLabel: createElement(
				"TextLabel",
				{
					AnchorPoint: new Vector2(0.5, 0.5),
					BackgroundColor3: Color3.fromRGB(255, 255, 255),
					BackgroundTransparency: 1,
					BorderColor3: Color3.fromRGB(0, 0, 0),
					BorderSizePixel: 0,
					Font: Enum.Font.Ubuntu,
					Position: new UDim2(new UDim(0.5, 0), new UDim(0.455, 0)),
					Size: new UDim2(new UDim(0.9, 0), new UDim(0.5, 0)),
					Text: "Are you sure you want to delete all bloxks?",
					TextColor3: Color3.fromRGB(255, 255, 255),
					TextScaled: true,
					TextSize: 35,
					TextWrapped: true,
				},
				{
					UITextSizeConstraint: createElement("UITextSizeConstraint", {
						MaxTextSize: 64,
					}),
				},
			),
			UIPadding: createElement("UIPadding", {
				PaddingBottom: new UDim(0.033, 0),
				PaddingLeft: new UDim(0.02, 0),
				PaddingRight: new UDim(0.02, 0),
				PaddingTop: new UDim(0.033, 0),
			}),
			ConfirmButton: confirmButton.getGui(),
			CancelButton: cancelButton.getGui(),
			/*TextButton2: createElement(
				"TextButton",
				{
					AnchorPoint: new Vector2(0, 1),
					BorderColor3: Color3.fromRGB(0, 0, 0),
					BorderSizePixel: 0,
					Font: Enum.Font.SourceSans,
					Position: new UDim2(new UDim(0, 0), new UDim(1, 0)),
					Size: new UDim2(new UDim(0.475, 0), new UDim(0.18, 0)),
					Text: "",
					TextColor3: Color3.fromRGB(255, 255, 255),
					TextSize: 1,
					TextWrapped: true,
				},
				{
					UICorner: createElement("UICorner"),
					Frame: createElement(
						"Frame",
						{
							AnchorPoint: new Vector2(0.5, 0.5),
							BackgroundColor3: Color3.fromRGB(34, 37, 49),
							BorderColor3: Color3.fromRGB(0, 0, 0),
							BorderSizePixel: 0,
							Position: new UDim2(new UDim(0.5, 0), new UDim(0.5, 0)),
							Size: new UDim2(new UDim(1, -6), new UDim(1, -6)),
						},
						{
							UICorner: createElement("UICorner"),
							TextLabel: createElement("TextLabel", {
								AnchorPoint: new Vector2(0.5, 0.5),
								BackgroundColor3: Color3.fromRGB(255, 255, 255),
								BackgroundTransparency: 1,
								BorderColor3: Color3.fromRGB(0, 0, 0),
								BorderSizePixel: 0,
								Font: Enum.Font.SourceSansBold,
								Position: new UDim2(new UDim(0.5, 0), new UDim(0.5, 0)),
								Size: new UDim2(new UDim(1, 0), new UDim(0.6, 0)),
								Text: "CANCEL",
								TextColor3: Color3.fromRGB(255, 255, 255),
								TextScaled: true,
								TextSize: 14,
								TextWrapped: true,
							}),
						},
					),
				},
			),*/
		},
	);

	const content = new Control(contents);
	window.setContents(content);
	content.add(confirmButton);
	content.add(cancelButton);

	return window;
};

/*
const blockSelection = createBlockSelection();
blockSelection.getGui().Parent = parent;
blockSelection.show();
*/

const aaaa = createPopup();
aaaa.getGui().Parent = parent;
aaaa.show();
