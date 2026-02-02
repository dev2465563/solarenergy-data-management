import path from "path";
import { FileRecordRepository } from "./repositories/file-record-repository.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const port = process.env.PORT ?? 3000;
const staticDir = process.env.STATIC_DIR;
const dataDir = process.env.DATA_DIR;
const repo = new FileRecordRepository(dataDir ? path.resolve(dataDir) : undefined);
const app = createApp(repo, {
  staticDir: staticDir ? path.resolve(staticDir) : undefined,
});

app.listen(port, () => {
  logger.info({ port }, "Backend listening");
});
