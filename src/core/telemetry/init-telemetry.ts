import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | null = null;

export async function initTelemetry() {
  if (sdk) {
    return;
  }

  sdk = new NodeSDK();
  await sdk.start();
}
