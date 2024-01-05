import { RunService } from "@rbxts/services";
import GuiController from "./GuiController";

const gui = GuiController.getGameUI<{ Fps: TextLabel }>().Fps;
gui.Visible = true;

let fps = 0;
RunService.Heartbeat.Connect((dt) => {
	fps = (fps + 1 / dt) / 2;
});

const tru = true;
while (tru) {
	task.wait(0.5);
	gui.Text = math.round(fps) + " fps";
}
