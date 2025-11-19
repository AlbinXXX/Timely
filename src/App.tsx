import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, AppShell, Tabs, Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTimerStore } from './stores/timerStore';
import { TimerDisplay } from "./components/TimerDisplay";
import { ControlButtons } from "./components/ControlButtons";
import { SummaryPage } from "./components/SummaryPage";

function App() {
  const { startTimer, pauseTimer, resumeTimer, endTimer } = useTimerStore();

  useEffect(() => {
    console.log('Setting up tray event listeners...');
    
    const unlistenStart = listen('tray-start-timer', () => {
      console.log('Received tray-start-timer event');
      startTimer();
    });

    const unlistenPause = listen('tray-pause-timer', () => {
      console.log('Received tray-pause-timer event');
      pauseTimer();
    });

    const unlistenResume = listen('tray-resume-timer', () => {
      console.log('Received tray-resume-timer event');
      resumeTimer();
    });

    const unlistenEnd = listen('tray-end-timer', () => {
      console.log('Received tray-end-timer event');
      endTimer();
    });

    return () => {
      unlistenStart.then(fn => fn());
      unlistenPause.then(fn => fn());
      unlistenResume.then(fn => fn());
      unlistenEnd.then(fn => fn());
    };
  }, [startTimer, pauseTimer, resumeTimer, endTimer]);

  return (
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" />
      <AppShell padding="md">
        <Container size="sm" p={0}>
          <Tabs defaultValue="timer" variant="pills">
            <Tabs.List grow>
              <Tabs.Tab value="timer">Timer</Tabs.Tab>
              <Tabs.Tab value="summary">Summary</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="timer" pt="md">
              <TimerDisplay />
              <ControlButtons />
            </Tabs.Panel>

            <Tabs.Panel value="summary" pt="md">
              <SummaryPage />
            </Tabs.Panel>
          </Tabs>
        </Container>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
