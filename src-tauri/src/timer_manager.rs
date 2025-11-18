use crate::models::Session;
use crate::session_store::SessionStore;
use anyhow::{Context, Result};
use chrono::Utc;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct TimerManager {
    current_session: Arc<Mutex<Option<Session>>>,
    store: Arc<SessionStore>,
}

impl TimerManager {
    pub fn new(store: Arc<SessionStore>) -> Result<Self> {
        let manager = Self {
            current_session: Arc::new(Mutex::new(None)),
            store,
        };

        // Check for active session on startup
        manager.recover_active_session()?;

        Ok(manager)
    }

    fn recover_active_session(&self) -> Result<()> {
        if let Some(session) = self.store.get_active_session()? {
            let mut current = self.current_session.lock().unwrap();
            *current = Some(session);
        }
        Ok(())
    }

    pub fn start_session(&self) -> Result<Session> {
        let mut current = self.current_session.lock().unwrap();

        if current.is_some() {
            anyhow::bail!("A session is already active");
        }

        let session = Session::new();
        self.store.save_session(&session)?;
        *current = Some(session.clone());

        Ok(session)
    }

    pub fn pause_session(&self) -> Result<Session> {
        let mut current = self.current_session.lock().unwrap();

        let session = current
            .as_mut()
            .context("No active session to pause")?;

        if session.is_paused() {
            anyhow::bail!("Session is already paused");
        }

        session.pauses.push(Utc::now());
        self.store.save_session(session)?;

        Ok(session.clone())
    }

    pub fn resume_session(&self) -> Result<Session> {
        let mut current = self.current_session.lock().unwrap();

        let session = current
            .as_mut()
            .context("No active session to resume")?;

        if !session.is_paused() {
            anyhow::bail!("Session is not paused");
        }

        session.resumes.push(Utc::now());
        self.store.save_session(session)?;

        Ok(session.clone())
    }

    pub fn end_session(&self) -> Result<Session> {
        let mut current = self.current_session.lock().unwrap();

        let mut session = current
            .take()
            .context("No active session to end")?;

        session.end = Some(Utc::now());
        session.total_seconds = session.calculate_total_seconds();
        self.store.save_session(&session)?;

        Ok(session)
    }

    pub fn get_current_session(&self) -> Option<Session> {
        self.current_session.lock().unwrap().clone()
    }

    pub fn get_current_elapsed_seconds(&self) -> i64 {
        let current = self.current_session.lock().unwrap();
        if let Some(session) = current.as_ref() {
            session.calculate_total_seconds()
        } else {
            0
        }
    }
}
