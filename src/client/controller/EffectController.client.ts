import { Players } from "@rbxts/services";
import Objects from "shared/_fixes_/objects";
import Effects from "shared/effects/Effects";
import { EffectsInvoker } from "shared/effects/EffectsInvoker";

for (const [_, effect] of Objects.pairs(Effects)) {
	effect.event.OnClientEvent.Connect((part, arg) => spawn(() => effect.justCreate(part, arg as never)));
}

EffectsInvoker.initialize((part, arg, forcePlayer, event) => {
	if (forcePlayer !== Players.LocalPlayer && forcePlayer !== "everyone") return;
	event.FireServer(part, arg);
});
