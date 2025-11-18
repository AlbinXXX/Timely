#!/usr/bin/env node

/**
 * Time Tracker MCP Server
 * 
 * This is a Model Context Protocol (MCP) server that provides
 * context and tools for the Time Tracker application to AI assistants.
 * 
 * It exposes project structure, session data, and application context
 * to improve AI suggestions and development assistance.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create MCP server instance
const server = new Server(
  {
    name: 'time-tracker-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_project_structure',
        description: 'Get the current project structure and architecture overview',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_session_data',
        description: 'Retrieve information about tracked sessions (if database exists)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of recent sessions to retrieve',
              default: 10,
            },
          },
        },
      },
    ],
  };
});

// Define available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'timetracker://prd',
        name: 'Product Requirements Document',
        description: 'Full PRD for the Time Tracker application',
        mimeType: 'text/markdown',
      },
      {
        uri: 'timetracker://architecture',
        name: 'Architecture Overview',
        description: 'System architecture and component structure',
        mimeType: 'text/markdown',
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_project_structure':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                frontend: {
                  framework: 'React + TypeScript',
                  buildTool: 'Vite',
                  stateManagement: 'Zustand',
                  components: ['TimerDisplay', 'ControlButtons', 'SessionList', 'SummaryPage'],
                },
                backend: {
                  framework: 'Tauri (Rust)',
                  modules: [
                    'timer_manager',
                    'session_store',
                    'excel_exporter',
                    'system_tray',
                    'commands',
                  ],
                  database: 'SQLite',
                },
                features: [
                  'Start/Pause/Resume/End timer',
                  'Excel export per session',
                  'Monthly summary view',
                  'macOS menu bar integration',
                  'Local data persistence',
                ],
              },
              null,
              2
            ),
          },
        ],
      };

    case 'get_session_data':
      const limit = args?.limit || 10;
      // This would read from actual database in production
      return {
        content: [
          {
            type: 'text',
            text: `Session data retrieval (limit: ${limit}) - Database integration pending`,
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'timetracker://prd':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: '# Time Tracker PRD\n\nSee project README.md for full requirements.',
          },
        ],
      };

    case 'timetracker://architecture':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# Architecture Overview

## Frontend (React + TypeScript)
- Vite build system
- Zustand for state management
- Components: TimerDisplay, ControlButtons, SessionList, SummaryPage

## Backend (Tauri + Rust)
- Modules: timer_manager, session_store, excel_exporter, system_tray
- SQLite for data persistence
- rust_xlsxwriter for Excel export

## Integration
- Tauri commands bridge Rust <-> JavaScript
- System tray for background operation
- Native notifications for user feedback
`,
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Time Tracker MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
