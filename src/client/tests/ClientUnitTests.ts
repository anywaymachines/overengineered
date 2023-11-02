import TestEZ from "@rbxts/testez";

export default class ClientUnitTests {
	public static runClient() {
		print();
		TestEZ.TestBootstrap.run([script.Parent as Instance]);
		print();
	}
}
