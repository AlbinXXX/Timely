#!/bin/bash

# Session Management Tool for Timely
# Simple shell script version using sqlite3 command

DB_PATH="$HOME/Library/Application Support/com.albinrushiti.timely/time-tracker.db"

case "$1" in
  list)
    echo "=== All Sessions ==="
    sqlite3 "$DB_PATH" "SELECT id, datetime(start, 'localtime') as start, datetime(end, 'localtime') as end, total_seconds FROM sessions ORDER BY start DESC" -header -column
    ;;
    
  clear-old)
    TODAY=$(date +%Y-%m-%d)
    echo "Clearing all sessions before $TODAY..."
    COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sessions WHERE date(start) < '$TODAY'")
    echo "Found $COUNT sessions to delete"
    
    if [ "$2" = "--confirm" ]; then
      sqlite3 "$DB_PATH" "DELETE FROM sessions WHERE date(start) < '$TODAY'"
      echo "✓ Deleted $COUNT sessions (kept today's)"
    else
      echo "Run with --confirm to proceed: $0 clear-old --confirm"
    fi
    ;;
    
  clear)
    if [ "$2" = "--confirm" ]; then
      sqlite3 "$DB_PATH" "DELETE FROM sessions"
      echo "✓ All sessions deleted"
    else
      echo "⚠️  This will delete ALL sessions!"
      echo "Run with --confirm to proceed: $0 clear --confirm"
    fi
    ;;
    
  add)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Usage: $0 add 'YYYY-MM-DD HH:MM' 'YYYY-MM-DD HH:MM'"
      exit 1
    fi
    
    START="$2"
    END="$3"
    ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    
    # Convert local time to UTC ISO format (accounting for timezone)
    START_UTC=$(date -j -f "%Y-%m-%d %H:%M" "$START" "+%Y-%m-%dT%H:%M:%S%z" 2>/dev/null | sed 's/\([+-][0-9][0-9]\)\([0-9][0-9]\)$/\1:\2/')
    END_UTC=$(date -j -f "%Y-%m-%d %H:%M" "$END" "+%Y-%m-%dT%H:%M:%S%z" 2>/dev/null | sed 's/\([+-][0-9][0-9]\)\([0-9][0-9]\)$/\1:\2/')
    
    if [ -z "$START_UTC" ] || [ -z "$END_UTC" ]; then
      echo "Error: Invalid date format. Use: YYYY-MM-DD HH:MM"
      exit 1
    fi
    
    # Calculate duration in seconds
    START_EPOCH=$(date -j -f "%Y-%m-%d %H:%M" "$START" "+%s")
    END_EPOCH=$(date -j -f "%Y-%m-%d %H:%M" "$END" "+%s")
    DURATION=$((END_EPOCH - START_EPOCH))
    
    sqlite3 "$DB_PATH" "INSERT INTO sessions (id, start, pauses, resumes, end, total_seconds) VALUES ('$ID', '$START_UTC', '[]', '[]', '$END_UTC', $DURATION)"
    
    echo "✓ Session added successfully!"
    echo "  ID: $ID"
    echo "  Start: $START"
    echo "  End: $END"
    echo "  Duration: $((DURATION / 3600))h $((DURATION % 3600 / 60))m"
    ;;
    
  *)
    echo "Timely Session Management Tool"
    echo ""
    echo "Usage:"
    echo "  $0 list"
    echo "  $0 add '2025-11-18 07:30' '2025-11-18 10:00'"
    echo "  $0 clear-old --confirm"
    echo "  $0 clear --confirm"
    echo ""
    echo "Examples:"
    echo "  # List all sessions"
    echo "  $0 list"
    echo ""
    echo "  # Clear all sessions except today's"
    echo "  $0 clear-old --confirm"
    echo ""
    echo "  # Add Nov 18 morning session (7:30 AM to 10:00 AM)"
    echo "  $0 add '2025-11-18 07:30' '2025-11-18 10:00'"
    echo ""
    echo "  # Add Nov 18 evening session (5:00 PM to 9:49 PM)"
    echo "  $0 add '2025-11-18 17:00' '2025-11-18 21:49'"
    echo ""
    echo "  # Add Nov 17 session (10:47 AM to 6:47 PM)"
    echo "  $0 add '2025-11-17 10:47' '2025-11-17 18:47'"
    ;;
esac
