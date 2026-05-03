import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const DEBUG_LOG_PATH = resolve(process.cwd(), ".ai-bridge.log");

function debugLog(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(" ")}\n`;
  try {
    appendFileSync(DEBUG_LOG_PATH, line);
  } catch {
    // best-effort logging only
  }
  console.error(line.trimEnd());
}

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
        "Return only one JSON object as your final answer. Use shape {\"message\": string, \"actions\": array}. Do not include Markdown fences, prose, or code blocks.",
      actionSchema: {
        create_node: { type: "create_node", node: { id: "optional", title: "string", kind: "Channel|Series|Video|Idea|Script|Research|Reference|Competitor|Keyword|Performance|Todo", summary: "string", markdown: "optional string", position: { x: "number", y: "number" } } },
        update_node: { type: "update_node", nodeId: "string|'selected'", patch: { title: "optional", kind: "optional", summary: "optional" } },
        delete_node: { type: "delete_node", nodeId: "string" },
        create_edge: { type: "create_edge", from: "nodeId|'selected'|'new:0'", to: "nodeId|'selected'|'new:1'", label: "optional string" },
        delete_edge: { type: "delete_edge", edgeId: "string" },
        open_markdown: { type: "open_markdown", nodeId: "string" },
        update_markdown: { type: "update_markdown", nodeId: "string", content: "full markdown string" },
        delete_markdown: { type: "delete_markdown", nodeId: "string" },
      },
      hints: [
        "When creating multiple nodes, reference them in subsequent create_edge actions via 'new:0', 'new:1' (their index in the actions array).",
        "Skip the position field unless the user asked for a specific layout — defaults will be used.",
        "Return at least one action; an empty actions array is invalid.",
      ],
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
    const parsed = JSON.parse(trimmed);
    const found = findActionsObject(parsed);
    if (found) return found;
  } catch {
    // Not a single JSON document; fall through to other strategies.
  }
  const jsonlResult = extractJsonFromJsonl(trimmed);
  if (jsonlResult) return jsonlResult;
  return parseFirstJsonObject(trimmed);
}

function findActionsObject(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return findActionsObject(JSON.parse(trimmed));
      } catch {
        // fall through to brace-scan on noisy strings (e.g. markdown fences).
      }
    }
    return scanStringForActions(trimmed);
  }
  if (typeof value !== "object") return null;
  if (!Array.isArray(value) && Array.isArray(value.actions)) return value;
  const items = Array.isArray(value) ? value : Object.values(value);
  for (const item of items) {
    const found = findActionsObject(item);
    if (found) return found;
  }
  return null;
}

function scanStringForActions(value) {
  for (let start = value.indexOf("{"); start !== -1; start = value.indexOf("{", start + 1)) {
    for (let end = value.lastIndexOf("}"); end > start; end = value.lastIndexOf("}", end - 1)) {
      try {
        const parsed = JSON.parse(value.slice(start, end + 1));
        const found = findActionsObject(parsed);
        if (found) return found;
      } catch {
        // Keep scanning.
      }
    }
  }
  return null;
}

function parseFirstJsonObject(value) {
  for (let start = value.indexOf("{"); start !== -1; start = value.indexOf("{", start + 1)) {
    for (let end = value.lastIndexOf("}"); end > start; end = value.lastIndexOf("}", end - 1)) {
      try {
        const parsed = JSON.parse(value.slice(start, end + 1));
        const found = findActionsObject(parsed);
        if (found) return found;
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
      const found = findActionsObject(event);
      if (found) return found;
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
      if (event?.is_error && typeof event.result === "string") messages.push(event.result);
    } catch {
      // Non-JSON progress output is not the error source we want.
    }
  }

  if (messages.length) return messages.join("\n");
  return stderr.trim() || stdout.trim();
}

const CLAUDE_SYSTEM_INSTRUCTION =
  'You are a stateless TubeMap mutation engine. Output exactly one raw JSON object with shape {"message": string, "actions": array}. ' +
  "Do not call any tools (no WebFetch, no WebSearch, no Bash, no file ops, no vidIQ). Do not ask the user permission or follow-up questions. " +
  "Do not wrap the JSON in markdown fences. Do not add prose, explanations, or apologies. Return JSON only.";

function applyProviderDefaults(command, args) {
  if (command !== "claude") return args;
  const joined = args.join(" ");
  const additions = [];
  if (!/(^|\s)--append-system-prompt(\s|=)/.test(joined) && !/(^|\s)--system-prompt(\s|=)/.test(joined)) {
    additions.push("--append-system-prompt", CLAUDE_SYSTEM_INSTRUCTION);
  }
  return [...args, ...additions];
}

function runCli({ command, args, cwd, timeoutMs, prompt }) {
  const finalArgs = applyProviderDefaults(command, args);
  return new Promise((resolve, reject) => {
    const child = spawn(command, finalArgs, {
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

          const finalArgs = applyProviderDefaults(command, args);
          debugLog("REQUEST", { command, finalArgs, message: body.message });
          debugLog("STDOUT", stdout.slice(0, 4000));
          if (stderr.trim()) debugLog("STDERR", stderr.slice(0, 2000));
          try {
            const result = extractJson(stdout);
            debugLog("RESULT", { actions: result.actions, message: result.message });
            sendJson(res, 200, {
              result,
              debug: {
                command: [command, ...finalArgs].join(" "),
                stderr: stderr.trim(),
              },
            });
          } catch (parseError) {
            debugLog("PARSE_ERROR", parseError.message);
            sendJson(res, 500, {
              error: parseError.message,
              preview: stdout.slice(0, 800),
            });
          }
        } catch (error) {
          debugLog("BRIDGE_ERROR", error.message);
          sendJson(res, 500, { error: error.message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localAiBridge()],
});
