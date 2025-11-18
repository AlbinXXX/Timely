# MCP Server Setup for GitHub Copilot

This guide explains how to set up and use the Model Context Protocol (MCP) server with GitHub Copilot in VS Code for the Time Tracker project.

## What is MCP?

The Model Context Protocol (MCP) allows AI assistants like GitHub Copilot to access project-specific context, tools, and resources. This significantly improves code suggestions and understanding of your project.

## Prerequisites

- **VS Code** with GitHub Copilot extension installed
- **Node.js** v18 or higher
- **pnpm** (or npm/yarn)

## Installation Steps

### 1. Install MCP Server Dependencies

Navigate to the `mcp-server` directory and install dependencies:

```bash
cd mcp-server
pnpm install
```

Or if you prefer npm:

```bash
npm install
```

### 2. Enable MCP in VS Code

The MCP configuration is already set up in `.vscode/mcp.json`. VS Code will automatically detect and use this configuration.

To verify MCP is working:

1. Open the Command Palette (`Cmd+Shift+P` on macOS)
2. Type "MCP" to see available MCP-related commands
3. You should see options like "MCP: Enable Server" or "MCP: Restart Server"

### 3. Configure for Claude Desktop (Optional)

If you're using Claude Desktop or other MCP-compatible tools, the configuration is in `.claude/mcp.json`.

To use it with Claude Desktop:

1. Copy the contents of `.claude/mcp.json`
2. Add it to your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

## MCP Server Features

The Time Tracker MCP server provides:

### Tools

1. **get_project_structure**
   - Returns the current project architecture
   - Helps Copilot understand component structure
   - No parameters required

2. **get_session_data**
   - Retrieves tracked session information
   - Parameters:
     - `limit` (number): Number of recent sessions to retrieve (default: 10)

### Resources

1. **timetracker://prd**
   - Product Requirements Document
   - Full context about project goals and features

2. **timetracker://architecture**
   - System architecture overview
   - Component relationships and data flow

## Using MCP with GitHub Copilot

Once MCP is enabled, Copilot will automatically:

- Have context about your project structure
- Understand the Tauri + React architecture
- Know about available Rust modules and React components
- Provide more accurate suggestions based on your PRD

### Example Use Cases

**Ask Copilot:**
- "Add a new method to the timer_manager module"
- "Create a new React component for displaying monthly statistics"
- "How should I structure the Excel export function?"

Copilot will use MCP context to provide more accurate, project-specific answers.

## Testing the MCP Server

You can test the MCP server manually:

```bash
cd mcp-server
node index.js
```

The server runs on stdio and communicates via JSON-RPC. You should see:
```
Time Tracker MCP server running on stdio
```

Press `Ctrl+C` to stop.

## Troubleshooting

### MCP Server Not Starting

1. Check Node.js version:
   ```bash
   node --version  # Should be v18 or higher
   ```

2. Reinstall dependencies:
   ```bash
   cd mcp-server
   rm -rf node_modules
   pnpm install
   ```

3. Check VS Code logs:
   - Open Command Palette → "Developer: Show Logs"
   - Look for MCP-related errors

### Copilot Not Using Context

1. Restart the MCP server:
   - Command Palette → "MCP: Restart Server"

2. Reload VS Code window:
   - Command Palette → "Developer: Reload Window"

3. Verify `.vscode/mcp.json` exists and is valid JSON

### Permission Issues

If you get permission errors on macOS:

```bash
chmod +x mcp-server/index.js
```

## Configuration Files

### `.vscode/mcp.json`

This is the main MCP configuration for VS Code. It defines:
- Server name: `time-tracker-mcp`
- Command: `node ./mcp-server/index.js`
- Working directory: workspace root
- Optional API key input (for future extensions)

It also includes the `filesystem` server for general file access.

### `.claude/mcp.json`

Alternative configuration for Claude Desktop and other MCP clients. Uses the same server but with slightly different syntax.

## Extending the MCP Server

To add new tools or resources, edit `mcp-server/index.js`:

### Adding a Tool

```javascript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: 'your_new_tool',
        description: 'What your tool does',
        inputSchema: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'Description of parameter',
            },
          },
        },
      },
    ],
  };
});

// Handle the tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'your_new_tool') {
    // Implement tool logic
    return {
      content: [
        {
          type: 'text',
          text: 'Tool result',
        },
      ],
    };
  }
});
```

### Adding a Resource

```javascript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      // ... existing resources
      {
        uri: 'timetracker://your-resource',
        name: 'Your Resource Name',
        description: 'Resource description',
        mimeType: 'text/plain',
      },
    ],
  };
});
```

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [GitHub Copilot with MCP](https://docs.github.com/en/copilot)
- [Tauri Documentation](https://tauri.app/)
- [VS Code Extension API](https://code.visualstudio.com/api)

## Support

For issues with:
- **MCP setup**: Check the [MCP GitHub repo](https://github.com/modelcontextprotocol)
- **Project-specific questions**: See the main README.md
- **Tauri questions**: See [Tauri documentation](https://tauri.app/)

---

**Note**: The MCP server runs locally and only accesses your project files. No data is sent to external servers.
