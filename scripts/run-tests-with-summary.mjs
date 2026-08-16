import { appendFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["--test"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let combined = "";
const retain = (chunk, stream) => {
  const text = chunk.toString();
  combined += text;
  if (combined.length > 160_000) combined = combined.slice(-160_000);
  stream.write(text);
};

child.stdout.on("data", (chunk) => retain(chunk, process.stdout));
child.stderr.on("data", (chunk) => retain(chunk, process.stderr));
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("close", async (code, signal) => {
  if (code !== 0) {
    const tail = combined.slice(-12_000);
    const annotation = tail
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.log(`::error title=npm test failure::${annotation}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const summaryTail = combined.slice(-40_000).replaceAll("```", "` ` `");
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `\n## npm test failure\n\nExit code: ${code ?? "null"}; signal: ${signal ?? "none"}\n\n\`\`\`text\n${summaryTail}\n\`\`\`\n`,
        "utf8",
      );
    }
  }
  process.exit(code ?? 1);
});
