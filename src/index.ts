import { createInfrastructure } from "./infrastructure/create";
import { createServer } from "./server";

const dbFile = process.env.DB_FILE;
if (!dbFile) {
  console.error("Required environment variable DB_FILE is not set");
  process.exit(1);
}

const port = process.env.PORT ?? "3000";

const infrastructure = createInfrastructure({ dbFile });
const server = createServer(infrastructure);
server
  .start(Number(port))
  .then(() => {
    console.log("Server started");
  })
  .catch((error: unknown) => {
    console.error("Server failed to start", error);
    process.exit(1);
  });
