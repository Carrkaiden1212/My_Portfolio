import { createClient } from "./bot.js";
import { config } from "./config.js";
import sodium from "libsodium-wrappers";

async function main(): Promise<void> {
  await sodium.ready;
  const client = createClient();
  await client.login(config.token);
}

main().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
