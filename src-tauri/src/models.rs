use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a time tracking session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub start: DateTime<Utc>,
    pub pauses: Vec<DateTime<Utc>>,
    pub resumes: Vec<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
    pub total_seconds: i64,
}

impl Session {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            start: Utc::now(),
            pauses: Vec::new(),
            resumes: Vec::new(),
            end: None,
            total_seconds: 0,
        }
    }

    /// Calculate total tracked seconds based on start, pauses, resumes, and end times
    pub fn calculate_total_seconds(&self) -> i64 {
        let end_time = self.end.unwrap_or_else(Utc::now);
        let mut total = (end_time - self.start).num_seconds();

        // Subtract pause durations
        for i in 0..self.pauses.len() {
            let pause_start = self.pauses[i];
            let pause_end = self.resumes.get(i).copied().unwrap_or(end_time);
            let pause_duration = (pause_end - pause_start).num_seconds();
            total -= pause_duration;
        }

        total.max(0)
    }

    /// Check if session is currently active (not ended)
    pub fn is_active(&self) -> bool {
        self.end.is_none()
    }

    /// Check if session is currently paused
    pub fn is_paused(&self) -> bool {
        self.is_active() && self.pauses.len() > self.resumes.len()
    }
}

/// Weekly summary with overtime tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklySummary {
    pub week_start: String,
    pub week_end: String,
    pub regular_hours: f64,
    pub overtime_hours: f64,
    pub total_hours: f64,
    pub session_count: usize,
}

/// Session summary for a specific month
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlySummary {
    pub year: i32,
    pub month: u32,
    pub total_seconds: i64,
    pub regular_hours: f64,
    pub overtime_hours: f64,
    pub session_count: usize,
    pub longest_session_seconds: i64,
    pub daily_breakdown: Vec<DailySummary>,
    pub weekly_breakdown: Vec<WeeklySummary>,
}

/// Daily summary within a month
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub total_seconds: i64,
    pub session_count: usize,
}

/// Timer state for the UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub is_running: bool,
    pub is_paused: bool,
    pub current_session_id: Option<String>,
    pub elapsed_seconds: i64,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            is_running: false,
            is_paused: false,
            current_session_id: None,
            elapsed_seconds: 0,
        }
    }
}
