import { StarterPlayer } from "@rbxts/services";

const ctest = StarterPlayer.GetDescendants()
	.filter((d) => d.IsA("ModuleScript") && d.HasTag("vcontrol"))
	.map((s) => s as ModuleScript & { Source: string });

for (let test of ctest) {
	const parent = test.Parent;
	test = test.Clone();
	test.Parent = parent;

	try {
		print("[VC] Executing " + test);
		require(test);
	} finally {
		test.Destroy();
	}
}
