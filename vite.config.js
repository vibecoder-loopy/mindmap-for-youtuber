import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import { defineConfig } from "vite";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function splitArgs(value) {
  if (!value?.trim()) return [];
  const matches = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return matches.map((arg) => arg.replace(/^["']|["']$/g, ""));
}

function buildPrompt({ message, state }) {
  return JSON.stringify(
    {
      role: "TubeMap local CLI bridge",
      instruction:
        "Return only one JSON object as your final answer. Use shape {\"message\": string, \"actions\": array}. Valid action types: create_node, update_node, delete_node, create_edge, delete_edge, open_markdown, update_markdown, delete_markdown. For node-targeted actions, use nodeId, not id. For create_edge, use from and to. Do not include Markdown fences, prose, or code blocks.",
      userMessage: message,
      appState: state,
    },
    null,
    2,
  );
}

function extractJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("The CLI returned no output.");
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonlResult = extractJsonFromJsonl(trimmed);
    if (jsonlResult) return jsonlResult;
    return parseFirstJsonObject(trimmed);
  }
}

function parseFirstJsonObject(value) {
  for (let start = value.indexOf("{"); start !== -1; start = value.indexOf("{", start + 1)) {
    for (let end = value.lastIndexOf("}"); end > start; end = value.lastIndexOf("}", end - 1)) {
      try {
        const parsed = JSON.parse(value.slice(start, end + 1));
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.actions)) return parsed;
      } catch {
        // Keep scanning for a valid object in noisy CLI output.
      }
    }
  }
  throw new Error("The CLI output did not contain a TubeMap action JSON object.");
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, output));
  }
  return output;
}

function extractJsonFromJsonl(value) {
  const candidates = [];
  for (const line of value.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    try {
      const event = JSON.parse(trimmedLine);
      if (event && typeof event === "object" && Array.isArray(event.actions)) return event;
      candidates.push(...collectStrings(event));
    } catch {
      candidates.push(trimmedLine);
    }
  }

  for (const candidate of candidates.reverse()) {
    try {
      const parsed = parseFirstJsonObject(candidate);
      if (parsed) return parsed;
    } catch {
      // Try the next event string.
    }
  }

  return null;
}

function extractCliError(stdout, stderr) {
  const messages = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const event = JSON.parse(trimmed);
      if (event?.type === "error" && event.message) messages.push(event.message);
      if (event?.type === "turn.failed" && event.error?.message) messages.push(event.error.message);
    } catch {
      // Non-JSON progress output is not the error source we want.
    }
  }

  if (messages.length) return messages.join("\n");
  return stderr.trim() || stdout.trim();
}

function runCli({ command, args, cwd, timeoutMs, prompt }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(extractCliError(stdout, stderr) || `Command exited with code ${code}.`));
        return;
      }
      resolve({ stdout, stderr });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function localAiBridge() {
  return {
    name: "local-ai-bridge",
    configureServer(server) {
      server.middlewares.use("/api/ai/compose", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed." });
          return;
        }

        try {
          const body = JSON.parse(await readBody(req));
          const command = body.settings?.command?.trim();
          const args = splitArgs(body.settings?.args);
          const timeoutMs = Number(body.settings?.timeoutMs || 60000);

          if (!command) {
            sendJson(res, 400, {
              error: "AI command is not configured.",
              preview: "Set an AI command such as `codex` and args such as `exec --json`.",
            });
            return;
          }

          const prompt = buildPrompt({ message: body.message, state: body.state });
          const { stdout, stderr } = await runCli({
            command,
            args,
            cwd: body.settings?.cwd,
            timeoutMs,
            prompt,
          });

          sendJson(res, 200, {
            result: extractJson(stdout),
            debug: {
              command: [command, ...args].join(" "),
              stderr: stderr.trim(),
            },
          });
        } catch (error) {
          sendJson(res, 500, { error: error.message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localAiBridge()],
});
