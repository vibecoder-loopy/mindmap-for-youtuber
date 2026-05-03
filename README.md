# TubeMap

TubeMap is a local-first mind map workspace for YouTubers. It helps organize channel analysis, video ideas, scripts, references, competitor research, and production tasks as connected nodes with Markdown notes.

The app is designed to run from a local clone. AI support is handled by calling a local CLI that the user has already installed and authenticated, not by storing API keys in the browser.

## Run Locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Local AI CLI

TubeMap includes a Vite dev-server bridge at `/api/ai/compose`. Configure the command from the composer settings in the app.

Pick a provider in the composer settings dropdown, or enter a custom command.

Codex CLI:

```text
AI command: codex
AI args: exec --json -m gpt-5.2
```

Claude CLI:

```text
AI command: claude
AI args: -p --output-format json
```

The CLI should return JSON in this shape:

```json
{
  "message": "Updated the map.",
  "actions": [
    { "type": "create_node", "node": { "title": "New Idea", "kind": "Idea" } },
    { "type": "create_edge", "from": "selected", "to": "new:0" }
  ]
}
```

No API keys or personal tokens should be committed to this repository.
