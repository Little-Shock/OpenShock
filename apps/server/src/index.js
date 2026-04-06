import { ServerCoordinator } from "./coordinator.js";
import { createHttpServer } from "./http-server.js";

const port = Number(process.env.PORT ?? 4300);
const escalationMs = Number(process.env.CONFLICT_ESCALATION_MS ?? 120000);

const coordinator = new ServerCoordinator({
  escalationMs
});
const server = createHttpServer(coordinator, {
  serverPort: port
});

server.listen(port, () => {
  process.stdout.write(
    `OpenShock server coordination core is listening on :${port} (conflict escalation ${escalationMs}ms)\n`
  );
});
