if (game.GetService("RunService").IsRunning()) {
	new Instance("BindableEvent").Event.Wait();
}

declare const TS: { import: (context: LuaSourceContainer, module: Instance, ...path: string[]) => unknown };
const previmport = TS.import;
const selfplugin = script;
TS.import = (mscript, module, ...path) => {
	if (module === game.GetService("ReplicatedStorage")) {
		module = selfplugin.Parent!;
	}

	return previmport(mscript, module, ...path);
};

const copyScripts = (parent: Instance, parentTo: Instance) => {
	for (const child of parent.GetChildren()) {
		if (child.IsA("ModuleScript")) {
			child.Clone().Parent = parentTo;
		} else if (child.IsA("Folder")) {
			const newparent = new Instance("Folder", parentTo);
			newparent.Name = child.Name;
			copyScripts(child, newparent);
		}
	}
};
copyScripts(game.GetService("StarterPlayer").WaitForChild("StarterPlayerScripts").WaitForChild("TS"), script.Parent!);
copyScripts(game.GetService("ReplicatedStorage"), script.Parent!);

import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { Element } from "shared/Element";

TS.import = previmport;

const selectionService = game.GetService("Selection" as keyof Services) as unknown as SelectionService;
const historyService = game.GetService("ChangeHistoryService" as keyof Services) as Instance as ChangeHistoryService;

//

type PluginGuiDefinition = GuiObject;
class PluginControl extends Control<PluginGuiDefinition> {
	constructor(gui: PluginGuiDefinition) {
		super(gui);

		const createInvoke = (func: (cframe: CFrame) => CFrame) => {
			return () => {
				const selected = selectionService
					.Get()
					.filter((s) => s.IsA("PVInstance")) as unknown as readonly PVInstance[];

				const name = historyService.TryBeginRecording("Invoking task");
				for (const sel of selected) {
					let result = func(rotationOnly ? sel.GetPivot().Rotation : sel.GetPivot());
					if (rotationOnly) result = result.add(sel.GetPivot().Position);

					sel.PivotTo(result);
					$log("Inverting\n", sel.GetPivot(), result);
				}

				if (name) {
					historyService.FinishRecording(name, Enum.FinishRecordingOperation.Commit);
				}
			};
		};
		const newbtn = (name: string, func: (cframe: CFrame) => CFrame) => {
			this.add(TextButtonControl.create({ Text: name, Size: new UDim2(0, 200, 0, 50) }, createInvoke(func)));
		};

		Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical, Parent: gui });

		let rotationOnly = false;
		const rotationOnlyBtn = this.add(
			TextButtonControl.create(
				{ Text: "Rotation only", BackgroundColor3: Colors.staticBackground, Size: new UDim2(0, 200, 0, 50) },
				() => {
					rotationOnly = !rotationOnly;
					rotationOnlyBtn.instance.BackgroundColor3 = rotationOnly ? Colors.green : Colors.staticBackground;
				},
			),
		);
		newbtn("Inverse", (cframe) => cframe.Inverse());

		{
			const mirrorwing = (cframe: CFrame, mode: "x" | "y" | "z") => {
				const [xAxis, yAxis, zAxis] = [Vector3.xAxis, Vector3.yAxis, Vector3.zAxis];
				const round = (vec: Vector3) => new Vector3(math.round(vec.X), math.round(vec.Y), math.round(vec.Z));
				const [xvec, yvec, zvec] = [
					round(cframe.RightVector),
					round(cframe.UpVector),
					round(cframe.LookVector),
				];

				switch (true) {
					case true:
						// Y targets Y
						if (yvec.Y !== 0) {
							if (mode === "x") cframe = CFrame.fromAxisAngle(xAxis, math.pi).mul(cframe);
							if (mode === "y") cframe = cframe.Rotation.Inverse().add(cframe.Position);
							if (mode === "z") cframe = CFrame.fromAxisAngle(zAxis, math.pi).mul(cframe);
							break;
						}

						// Y targets X
						if (yvec.X !== 0) {
							if (mode === "x") cframe = CFrame.fromAxisAngle(yAxis, math.pi).mul(cframe);
							if (mode === "y") cframe = CFrame.fromAxisAngle(zAxis, math.pi).mul(cframe);
							if (mode === "z") break;
							break;
						}

						// Y targets Z
						if (mode === "x") break;
						if (mode === "y") cframe = CFrame.fromAxisAngle(xAxis, math.pi).mul(cframe);
						if (mode === "z") cframe = CFrame.fromAxisAngle(yAxis, math.pi).mul(cframe);
				}

				return cframe;
			};
			newbtn("X Wing mirror", (cframe) => mirrorwing(cframe, "x"));
			newbtn("Y Wing mirror", (cframe) => mirrorwing(cframe, "y"));
			newbtn("Z Wing mirror", (cframe) => mirrorwing(cframe, "z"));
		}
	}
}

//

const toolbar = plugin.CreateToolbar("CFVisualizer");
const pluginButton = toolbar.CreateButton("CFVisualizer", "Show cfvisualizer", "rbxassetid://1507949215");

const info = new DockWidgetPluginGuiInfo(Enum.InitialDockState.Left, false);
const widget = plugin.CreateDockWidgetPluginGui("i3cfvisualizer", info);
widget.Title = "CFVisualizer";

const gui: PluginGuiDefinition = Element.create("Frame", {
	Size: new UDim2(1, 0, 1, 0),
	BackgroundColor3: Color3.fromRGB(0, 0, 0),
});
gui.Visible = true;
gui.Parent = widget;

const root = new ContainerComponent();
const control = root.add(new PluginControl(gui));

root.setEnabled(widget.Enabled);
pluginButton.Click.Connect(() => {
	widget.Enabled = !widget.Enabled;
	root.setEnabled(widget.Enabled);
});
