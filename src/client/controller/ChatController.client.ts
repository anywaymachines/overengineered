import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";

// TODO: CHANGE

Remotes.Client.GetNamespace("Player")
	.Get("SendChatMessage")
	.Connect((text, color) => addMessage(text, color));

function addMessage(text: string, color: Color3) {
	LogControl.instance.addLine(text, color);
}
