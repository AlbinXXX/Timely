#!/usr/bin/env node

/**
 * Session Management Tool for Timely
 * 
 * Usage:
 *   node manage_sessions.js list
 *   node manage_sessions.js add "2025-11-18 07:30" "2025-11-18 10:00"
 *   node manage_sessions.js delete <session-id>
 *   node manage_sessions.js clear
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Database path
const dbPath = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'com.albinrushiti.timely',
  'time-tracker.db'
);

console.log(`Using database: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath);

function listSessions() {
  db.all('SELECT * FROM sessions ORDER BY start DESC', [], (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('=== All Sessions ===\n');
    rows.forEach(row => {
      const start = new Date(row.start);
      const end = row.end ? new Date(row.end) : null;
      const hours = Math.floor(row.total_seconds / 3600);
      const minutes = Math.floor((row.total_seconds % 3600) / 60);
      
      console.log(`ID: ${row.id}`);
      console.log(`Start: ${start.toLocaleString()}`);
      console.log(`End: ${end ? end.toLocaleString() : 'Active'}`);
      console.log(`Duration: ${hours}h ${minutes}m`);
      console.log(`Total Seconds: ${row.total_seconds}`);
      console.log('---\n');
    });
    
    db.close();
  });
}

function addSession(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Invalid date format. Use: YYYY-MM-DD HH:MM');
    db.close();
    return;
  }
  
  const totalSeconds = Math.floor((end - start) / 1000);
  const id = uuidv4();
  
  const session = {
    id,
    start: start.toISOString(),
    pauses: '[]',
    resumes: '[]',
    end: end.toISOString(),
    total_seconds: totalSeconds
  };
  
  db.run(
    'INSERT INTO sessions (id, start, pauses, resumes, end, total_seconds) VALUES (?, ?, ?, ?, ?, ?)',
    [session.id, session.start, session.pauses, session.resumes, session.end, session.total_seconds],
    function(err) {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`✓ Session added successfully!`);
        console.log(`  ID: ${id}`);
        console.log(`  Start: ${start.toLocaleString()}`);
        console.log(`  End: ${end.toLocaleString()}`);
        console.log(`  Duration: ${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`);
      }
      db.close();
    }
  );
}

function deleteSession(id) {
  db.run('DELETE FROM sessions WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error:', err);
    } else if (this.changes === 0) {
      console.log('Session not found');
    } else {
      console.log('✓ Session deleted successfully');
    }
    db.close();
  });
}

function clearAllSessions() {
  db.run('DELETE FROM sessions', [], function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`✓ Deleted ${this.changes} sessions`);
    }
    db.close();
  });
}

function clearExceptToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  
  db.run('DELETE FROM sessions WHERE start < ?', [todayStr], function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`✓ Deleted ${this.changes} sessions (kept today's sessions)`);
    }
    db.close();
  });
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'list':
    listSessions();
    break;
  
  case 'add':
    const startStr = process.argv[3];
    const endStr = process.argv[4];
    if (!startStr || !endStr) {
      console.error('Usage: node manage_sessions.js add "YYYY-MM-DD HH:MM" "YYYY-MM-DD HH:MM"');
      process.exit(1);
    }
    addSession(startStr, endStr);
    break;
  
  case 'delete':
    const id = process.argv[3];
    if (!id) {
      console.error('Usage: node manage_sessions.js delete <session-id>');
      process.exit(1);
    }
    deleteSession(id);
    break;
  
  case 'clear':
    console.log('⚠️  This will delete ALL sessions. Are you sure?');
    console.log('Run with: node manage_sessions.js clear --confirm');
    if (process.argv[3] === '--confirm') {
      clearAllSessions();
    } else {
      db.close();
    }
    break;
  
  case 'clear-old':
    console.log('⚠️  This will delete all sessions except today\'s. Are you sure?');
    console.log('Run with: node manage_sessions.js clear-old --confirm');
    if (process.argv[3] === '--confirm') {
      clearExceptToday();
    } else {
      db.close();
    }
    break;
  
  default:
    console.log('Timely Session Management Tool\n');
    console.log('Usage:');
    console.log('  node manage_sessions.js list');
    console.log('  node manage_sessions.js add "2025-11-18 07:30" "2025-11-18 10:00"');
    console.log('  node manage_sessions.js delete <session-id>');
    console.log('  node manage_sessions.js clear --confirm');
    console.log('  node manage_sessions.js clear-old --confirm');
    console.log('\nExamples:');
    console.log('  # Add a session from 7:30 AM to 10:00 AM on Nov 18');
    console.log('  node manage_sessions.js add "2025-11-18 07:30" "2025-11-18 10:00"');
    console.log('\n  # Add a session from 5:00 PM to 9:49 PM on Nov 18');
    console.log('  node manage_sessions.js add "2025-11-18 17:00" "2025-11-18 21:49"');
    console.log('\n  # Add a session from 10:47 AM to 6:47 PM on Nov 17');
    console.log('  node manage_sessions.js add "2025-11-17 10:47" "2025-11-17 18:47"');
    db.close();
}
