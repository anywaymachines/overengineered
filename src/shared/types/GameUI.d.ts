type Toolbar = Frame & {
	Buttons: Frame & {
		Template: ToolbarButton;
	};

	// Tooltips
	GamepadBack: ImageLabel;
	GamepadNext: ImageLabel;
};

type ToolbarButton = TextButton & {
	ImageLabel: ImageLabel;
	KeyboardNumberLabel: TextLabel;
};

// ToolInfo

type ToolInfo = Frame & {
	NameLabel: TextLabel;
	DescriptionLabel: TextLabel;
};

interface GameUI {
	Toolbar: Toolbar;
	ToolInfo: ToolInfo;
}
