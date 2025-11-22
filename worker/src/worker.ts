import { Worker, NativeConnection } from "@temporalio/worker";
import { watch } from "chokidar";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || "localhost:7233";
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || "temporal-visual";
const WORKFLOWS_DIR = path.join(__dirname, "../../workflows/definitions");
const ACTIVITIES_DIR = path.join(__dirname, "../../workflows/activities");

async function run() {
  console.log("🚀 Starting Temporal Worker...");
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Temporal Address: ${TEMPORAL_ADDRESS}`);
  console.log(`Task Queue: ${TASK_QUEUE}`);

  let worker: Worker | null = null;
  let isRestarting = false;

  async function startWorker() {
    if (isRestarting) return;

    try {
      // Connect to Temporal server
      const connection = await NativeConnection.connect({
        address: TEMPORAL_ADDRESS,
      });

      // Create worker
      worker = await Worker.create({
        connection,
        namespace: "default",
        taskQueue: TASK_QUEUE,
        workflowsPath: WORKFLOWS_DIR,
        activities: await loadActivities(),
      });

      console.log("✅ Worker created successfully");
      console.log(`📁 Watching workflows: ${WORKFLOWS_DIR}`);

      // Run the worker
      await worker.run();
    } catch (error) {
      console.error("❌ Error starting worker:", error);
      process.exit(1);
    }
  }

  async function loadActivities() {
    try {
      const activitiesModule = await import(path.join(ACTIVITIES_DIR, "index.ts"));
      return activitiesModule;
    } catch (error) {
      console.warn("⚠️  No activities found, using empty activities");
      return {};
    }
  }

  async function restartWorker() {
    if (isRestarting) return;
    isRestarting = true;

    console.log("\n🔄 Detected file changes, restarting worker...");

    if (worker) {
      try {
        await worker.shutdown();
        console.log("✅ Worker shutdown complete");
      } catch (error) {
        console.error("Error shutting down worker:", error);
      }
    }

    // Clear require cache for workflows and activities
    Object.keys(require.cache).forEach((key) => {
      if (key.includes("workflows")) {
        delete require.cache[key];
      }
    });

    isRestarting = false;
    await startWorker();
  }

  // Watch for file changes
  const watcher = watch([WORKFLOWS_DIR, ACTIVITIES_DIR], {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("change", (filePath) => {
    console.log(`📝 File changed: ${filePath}`);
    restartWorker();
  });

  watcher.on("add", (filePath) => {
    console.log(`➕ File added: ${filePath}`);
    restartWorker();
  });

  // Handle shutdown
  process.on("SIGINT", async () => {
    console.log("\n⏹️  Shutting down worker...");
    await watcher.close();
    if (worker) {
      await worker.shutdown();
    }
    process.exit(0);
  });

  // Start the worker
  await startWorker();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
