use crate::models::Session;
use anyhow::Result;
use rust_xlsxwriter::*;
use std::path::PathBuf;

pub struct ExcelExporter;

impl ExcelExporter {
    pub fn export_session(session: &Session, output_path: PathBuf) -> Result<PathBuf> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();

        // Set column widths
        worksheet.set_column_width(0, 20)?;
        worksheet.set_column_width(1, 25)?;

        // Add title
        let title_format = Format::new()
            .set_bold()
            .set_font_size(14)
            .set_font_color(Color::RGB(0x1F4788));
        
        worksheet.write_with_format(0, 0, "Time Tracker Session", &title_format)?;

        // Session details
        let header_format = Format::new().set_bold();
        
        worksheet.write_with_format(2, 0, "Session ID:", &header_format)?;
        worksheet.write(2, 1, &session.id)?;

        worksheet.write_with_format(3, 0, "Start Time:", &header_format)?;
        worksheet.write(3, 1, session.start.format("%Y-%m-%d %H:%M:%S").to_string())?;

        if let Some(end) = session.end {
            worksheet.write_with_format(4, 0, "End Time:", &header_format)?;
            worksheet.write(4, 1, end.format("%Y-%m-%d %H:%M:%S").to_string())?;
        }

        worksheet.write_with_format(5, 0, "Total Time:", &header_format)?;
        worksheet.write(5, 1, format_duration(session.total_seconds))?;

        // Pause/Resume history
        if !session.pauses.is_empty() {
            worksheet.write_with_format(7, 0, "Pause/Resume History", &title_format)?;
            
            worksheet.write_with_format(8, 0, "Event", &header_format)?;
            worksheet.write_with_format(8, 1, "Time", &header_format)?;

            let mut row = 9;
            for (i, pause) in session.pauses.iter().enumerate() {
                worksheet.write(row, 0, "Paused")?;
                worksheet.write(row, 1, pause.format("%Y-%m-%d %H:%M:%S").to_string())?;
                row += 1;

                if let Some(resume) = session.resumes.get(i) {
                    worksheet.write(row, 0, "Resumed")?;
                    worksheet.write(row, 1, resume.format("%Y-%m-%d %H:%M:%S").to_string())?;
                    row += 1;
                }
            }
        }

        workbook.save(&output_path)?;
        Ok(output_path)
    }

    pub fn export_monthly_summary(
        year: i32,
        month: u32,
        sessions: &[Session],
        output_path: PathBuf,
    ) -> Result<PathBuf> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();

        // Set column widths
        worksheet.set_column_width(0, 15)?;
        worksheet.set_column_width(1, 20)?;
        worksheet.set_column_width(2, 15)?;
        worksheet.set_column_width(3, 25)?;

        // Title
        let title_format = Format::new()
            .set_bold()
            .set_font_size(14)
            .set_font_color(Color::RGB(0x1F4788));
        
        worksheet.write_with_format(
            0,
            0,
            format!("Monthly Summary - {}-{:02}", year, month),
            &title_format,
        )?;

        // Summary statistics
        let header_format = Format::new().set_bold();
        let total_seconds: i64 = sessions.iter().map(|s| s.total_seconds).sum();
        let longest_session = sessions
            .iter()
            .map(|s| s.total_seconds)
            .max()
            .unwrap_or(0);

        worksheet.write_with_format(2, 0, "Total Sessions:", &header_format)?;
        worksheet.write(2, 1, sessions.len() as f64)?;

        worksheet.write_with_format(3, 0, "Total Time:", &header_format)?;
        worksheet.write(3, 1, format_duration(total_seconds))?;

        worksheet.write_with_format(4, 0, "Longest Session:", &header_format)?;
        worksheet.write(4, 1, format_duration(longest_session))?;

        // Sessions list
        worksheet.write_with_format(6, 0, "Session Details", &title_format)?;

        worksheet.write_with_format(7, 0, "Date", &header_format)?;
        worksheet.write_with_format(7, 1, "Start Time", &header_format)?;
        worksheet.write_with_format(7, 2, "Duration", &header_format)?;
        worksheet.write_with_format(7, 3, "Session ID", &header_format)?;

        let mut row = 8;
        for session in sessions {
            worksheet.write(row, 0, session.start.format("%Y-%m-%d").to_string())?;
            worksheet.write(row, 1, session.start.format("%H:%M:%S").to_string())?;
            worksheet.write(row, 2, format_duration(session.total_seconds))?;
            worksheet.write(row, 3, &session.id)?;
            row += 1;
        }

        workbook.save(&output_path)?;
        Ok(output_path)
    }
}

fn format_duration(seconds: i64) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, secs)
}
