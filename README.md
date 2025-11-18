# Time Tracker

A minimal macOS desktop time tracking app built with Tauri + React + TypeScript.

## Features

- ⏱️ **Simple Time Tracking**: Start, pause, resume, and end sessions with large, intuitive buttons
- 📊 **Excel Export**: Automatically generate `.xlsx` files for each completed session
- 📅 **Monthly Summary**: View and export comprehensive monthly time reports
- 🍎 **macOS Integration**: Menu bar icon for quick access and background operation
- 💾 **Local Storage**: All data stored locally using SQLite (no cloud required)
- 🔔 **Notifications**: Get notified when tracking starts, pauses, or ends

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri 2 + Rust
- **Database**: SQLite (via rusqlite)
- **Export**: rust_xlsxwriter for Excel generation
- **State Management**: Zustand
- **Developer Tools**: MCP (Model Context Protocol) integration for enhanced AI assistance

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended) or npm
- **Rust** (latest stable version)
- **Xcode Command Line Tools** (macOS)

## Getting Started

### 1. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install MCP server dependencies (for enhanced Copilot support)
cd mcp-server
pnpm install
cd ..
```

### 2. Run Development Mode

```bash
pnpm tauri dev
```

This will:
- Start the Vite dev server on `http://localhost:1420`
- Launch the Tauri app with hot-reload enabled
- Open the macOS application window

### 3. Build for Production

```bash
pnpm tauri build
```

The compiled `.app` will be in `src-tauri/target/release/bundle/macos/`

## Project Structure

```
Timely/
├── src/                      # React frontend
│   ├── components/           # React components
│   ├── stores/              # Zustand state management
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── main.rs          # Tauri app entry
│   │   ├── timer_manager.rs # Timer logic
│   │   ├── session_store.rs # SQLite operations
│   │   ├── excel_exporter.rs# Excel generation
│   │   └── system_tray.rs   # Menu bar integration
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── mcp-server/              # MCP server for AI assistance
│   ├── index.js             # MCP server implementation
│   └── package.json         # MCP dependencies
├── .vscode/                 # VS Code configuration
│   ├── mcp.json             # MCP server config for Copilot
│   └── extensions.json      # Recommended extensions
├── .claude/                 # Claude Desktop MCP config
│   └── mcp.json
└── MCP_SETUP.md             # MCP setup instructions
```

## Usage

### Starting a Session

1. Click the **Start** button
2. Timer begins tracking immediately
3. Session is automatically saved to local database

### Pausing/Resuming

1. Click **Pause** to temporarily stop tracking
2. Click **Resume** to continue from where you left off
3. All pause/resume timestamps are recorded

### Ending a Session

1. Click **End** to complete the session
2. An Excel file is automatically generated: `Session-YYYY-MM-DD-HH-MM.xlsx`
3. File saved to your Downloads folder (configurable)
4. Session data remains in local database for history

### Monthly Summary

1. Navigate to the Summary tab
2. Select a month from the dropdown
3. View total hours, number of sessions, and daily breakdown
4. Click **Export** to generate `MonthlySummary-YYYY-MM.xlsx`

### Menu Bar Quick Actions

- Click the menu bar icon to see current timer
- Quick access to Start/Pause/Resume/End without opening the window
- Status indicator shows if timer is active or paused

## Developer Setup

### Enhanced AI Assistance with MCP

This project includes Model Context Protocol (MCP) integration for improved GitHub Copilot and Claude suggestions.

**Quick Start:**
```bash
cd mcp-server
pnpm install
```

**Full Documentation:** See [MCP_SETUP.md](./MCP_SETUP.md) for complete setup instructions.

**Benefits:**
- Copilot understands your project structure
- Context-aware code suggestions
- Access to project requirements and architecture
- Better understanding of Tauri + React patterns

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- Extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

### Development Commands

```bash
# Run in development mode with hot-reload
pnpm tauri dev

# Build production app
pnpm tauri build

# Run frontend only (without Tauri)
pnpm dev

# Build frontend only
pnpm build

# Preview production build
pnpm preview

# Lint and format
pnpm lint
pnpm format
```

## Architecture

### Frontend (React)

- **Components**: Modular React components for timer, controls, and summary
- **State Management**: Zustand for global timer state
- **Styling**: Modern CSS with macOS-native look
- **API Integration**: Tauri commands for Rust backend communication

### Backend (Rust)

- **timer_manager**: Handles start/pause/resume/end logic and state persistence
- **session_store**: SQLite database operations for storing sessions
- **excel_exporter**: Generates `.xlsx` files using rust_xlsxwriter
- **system_tray**: macOS menu bar integration and notifications
- **commands**: Tauri command handlers exposing Rust functions to JavaScript

### Data Model

```rust
struct Session {
    id: Uuid,
    start: DateTime<Utc>,
    pauses: Vec<DateTime<Utc>>,
    resumes: Vec<DateTime<Utc>>,
    end: Option<DateTime<Utc>>,
    total_seconds: i64,
}
```

Sessions are stored in SQLite with the following schema:
- `sessions` table with all session data
- Automatic recovery of in-progress sessions on app restart
- Efficient querying for monthly summaries

## Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Window size and behavior
- App icon and metadata
- Build targets and bundle settings
- Plugin configurations

### Database Location

By default, SQLite database is stored at:
```
~/Library/Application Support/com.timetracker.app/time-tracker.db
```

## Edge Cases Handled

- ✅ Session recovery after app crash
- ✅ Midnight crossover sessions
- ✅ macOS sleep/wake cycle
- ✅ Pausing then closing app (resumable on next launch)
- ✅ Disk full / permission errors on export
- ✅ Ending a paused session (correct time calculation)

## Troubleshooting

### App Won't Start

1. Ensure Rust is installed: `rustc --version`
2. Update Tauri CLI: `pnpm add -D @tauri-apps/cli@latest`
3. Clear build cache: `rm -rf src-tauri/target`

### Timer Not Persisting

- Check database permissions
- Verify SQLite installation: `rusqlite` crate
- Check logs in Console.app (macOS)

### Excel Export Fails

- Ensure write permissions to export directory
- Check disk space
- Verify rust_xlsxwriter dependency

### MCP Server Issues

See [MCP_SETUP.md](./MCP_SETUP.md) for detailed troubleshooting.

## Contributing

This is a personal project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Future Enhancements

- 🏷️ Tagging sessions (Work/Break/Project)
- 📂 Project/task categorization
- 📄 Export to CSV and PDF
- ☁️ Optional iCloud sync
- 📱 iOS companion app
- 🌙 Dark mode support
- 🤖 Auto-pause based on idle detection

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check [MCP_SETUP.md](./MCP_SETUP.md) for MCP-related issues
- See [Tauri documentation](https://tauri.app/) for Tauri questions
- Open an issue on GitHub

---

Built with ❤️ using Tauri + React + TypeScript
# Timely
