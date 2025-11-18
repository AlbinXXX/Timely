use crate::models::{DailySummary, MonthlySummary, Session};
use anyhow::{Context, Result};
use chrono::{DateTime, NaiveDate, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use std::path::PathBuf;

pub struct SessionStore {
    db_path: PathBuf,
}

impl SessionStore {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let store = Self { db_path };
        store.init_database()?;
        Ok(store)
    }

    fn get_connection(&self) -> Result<Connection> {
        Connection::open(&self.db_path).context("Failed to open database connection")
    }

    fn init_database(&self) -> Result<()> {
        let conn = self.get_connection()?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                start TEXT NOT NULL,
                pauses TEXT NOT NULL,
                resumes TEXT NOT NULL,
                end TEXT,
                total_seconds INTEGER NOT NULL
            )",
            [],
        )
        .context("Failed to create sessions table")?;

        Ok(())
    }

    pub fn save_session(&self, session: &Session) -> Result<()> {
        let conn = self.get_connection()?;

        let pauses_json = serde_json::to_string(&session.pauses)?;
        let resumes_json = serde_json::to_string(&session.resumes)?;
        let end_str = session.end.map(|dt| dt.to_rfc3339());

        conn.execute(
            "INSERT OR REPLACE INTO sessions (id, start, pauses, resumes, end, total_seconds)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session.id,
                session.start.to_rfc3339(),
                pauses_json,
                resumes_json,
                end_str,
                session.total_seconds,
            ],
        )
        .context("Failed to save session")?;

        Ok(())
    }

    pub fn get_session(&self, id: &str) -> Result<Option<Session>> {
        let conn = self.get_connection()?;

        let mut stmt = conn.prepare(
            "SELECT id, start, pauses, resumes, end, total_seconds FROM sessions WHERE id = ?1",
        )?;

        let session = stmt
            .query_row(params![id], |row| {
                let pauses_json: String = row.get(2)?;
                let resumes_json: String = row.get(3)?;
                let end_str: Option<String> = row.get(4)?;

                Ok(Session {
                    id: row.get(0)?,
                    start: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                        .unwrap()
                        .with_timezone(&Utc),
                    pauses: serde_json::from_str(&pauses_json).unwrap_or_default(),
                    resumes: serde_json::from_str(&resumes_json).unwrap_or_default(),
                    end: end_str
                        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                        .map(|dt| dt.with_timezone(&Utc)),
                    total_seconds: row.get(5)?,
                })
            })
            .optional()?;

        Ok(session)
    }

    pub fn get_active_session(&self) -> Result<Option<Session>> {
        let conn = self.get_connection()?;

        let mut stmt = conn.prepare(
            "SELECT id, start, pauses, resumes, end, total_seconds 
             FROM sessions 
             WHERE end IS NULL 
             ORDER BY start DESC 
             LIMIT 1",
        )?;

        let session = stmt
            .query_row([], |row| {
                let pauses_json: String = row.get(2)?;
                let resumes_json: String = row.get(3)?;

                Ok(Session {
                    id: row.get(0)?,
                    start: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                        .unwrap()
                        .with_timezone(&Utc),
                    pauses: serde_json::from_str(&pauses_json).unwrap_or_default(),
                    resumes: serde_json::from_str(&resumes_json).unwrap_or_default(),
                    end: None,
                    total_seconds: row.get(5)?,
                })
            })
            .optional()?;

        Ok(session)
    }

    pub fn get_all_sessions(&self) -> Result<Vec<Session>> {
        let conn = self.get_connection()?;

        let mut stmt = conn.prepare(
            "SELECT id, start, pauses, resumes, end, total_seconds 
             FROM sessions 
             ORDER BY start DESC",
        )?;

        let sessions = stmt
            .query_map([], |row| {
                let pauses_json: String = row.get(2)?;
                let resumes_json: String = row.get(3)?;
                let end_str: Option<String> = row.get(4)?;

                Ok(Session {
                    id: row.get(0)?,
                    start: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                        .unwrap()
                        .with_timezone(&Utc),
                    pauses: serde_json::from_str(&pauses_json).unwrap_or_default(),
                    resumes: serde_json::from_str(&resumes_json).unwrap_or_default(),
                    end: end_str
                        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                        .map(|dt| dt.with_timezone(&Utc)),
                    total_seconds: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(sessions)
    }

    pub fn get_monthly_summary(&self, year: i32, month: u32) -> Result<MonthlySummary> {
        let sessions = self.get_sessions_for_month(year, month)?;

        let mut total_seconds = 0i64;
        let mut longest_session_seconds = 0i64;
        let mut daily_map: std::collections::HashMap<String, (i64, usize)> =
            std::collections::HashMap::new();

        for session in &sessions {
            total_seconds += session.total_seconds;
            longest_session_seconds = longest_session_seconds.max(session.total_seconds);

            let date_key = session.start.format("%Y-%m-%d").to_string();
            let entry = daily_map.entry(date_key).or_insert((0, 0));
            entry.0 += session.total_seconds;
            entry.1 += 1;
        }

        let mut daily_breakdown: Vec<DailySummary> = daily_map
            .into_iter()
            .map(|(date, (seconds, count))| DailySummary {
                date,
                total_seconds: seconds,
                session_count: count,
            })
            .collect();

        daily_breakdown.sort_by(|a, b| a.date.cmp(&b.date));

        Ok(MonthlySummary {
            year,
            month,
            total_seconds,
            session_count: sessions.len(),
            longest_session_seconds,
            daily_breakdown,
        })
    }

    fn get_sessions_for_month(&self, year: i32, month: u32) -> Result<Vec<Session>> {
        let start_date = NaiveDate::from_ymd_opt(year, month, 1)
            .context("Invalid date")?
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();

        let end_date = if month == 12 {
            NaiveDate::from_ymd_opt(year + 1, 1, 1)
        } else {
            NaiveDate::from_ymd_opt(year, month + 1, 1)
        }
        .context("Invalid date")?
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();

        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, start, pauses, resumes, end, total_seconds 
             FROM sessions 
             WHERE start >= ?1 AND start < ?2
             ORDER BY start ASC",
        )?;

        let sessions = stmt
            .query_map(
                params![start_date.to_rfc3339(), end_date.to_rfc3339()],
                |row| {
                    let pauses_json: String = row.get(2)?;
                    let resumes_json: String = row.get(3)?;
                    let end_str: Option<String> = row.get(4)?;

                    Ok(Session {
                        id: row.get(0)?,
                        start: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                            .unwrap()
                            .with_timezone(&Utc),
                        pauses: serde_json::from_str(&pauses_json).unwrap_or_default(),
                        resumes: serde_json::from_str(&resumes_json).unwrap_or_default(),
                        end: end_str
                            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                            .map(|dt| dt.with_timezone(&Utc)),
                        total_seconds: row.get(5)?,
                    })
                },
            )?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(sessions)
    }
}
