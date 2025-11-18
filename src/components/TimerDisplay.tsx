import { useEffect } from 'react';
import { Card, Text, Badge, Group, Stack } from '@mantine/core';
import { invoke } from '@tauri-apps/api/core';
import { useTimerStore } from '../stores/timerStore';

export function TimerDisplay() {
  const { timerState, currentTime, refreshTimerState } = useTimerStore();

  useEffect(() => {
    refreshTimerState();
    const interval = setInterval(() => {
      refreshTimerState();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshTimerState]);

  // Update tray menu every 10 seconds with current elapsed time
  useEffect(() => {
    if (timerState.is_running) {
      const updateTray = async () => {
        await invoke('update_tray', {
          isRunning: timerState.is_running,
          isPaused: timerState.is_paused,
          elapsedSeconds: timerState.elapsed_seconds
        });
      };
      
      updateTray();
      const interval = setInterval(updateTray, 10000);
      return () => clearInterval(interval);
    }
  }, [timerState.is_running, timerState.is_paused, timerState.elapsed_seconds]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!timerState.is_running) return 'gray';
    return timerState.is_paused ? 'yellow' : 'green';
  };

  const getStatusText = () => {
    if (!timerState.is_running) return 'Inactive';
    return timerState.is_paused ? 'Paused' : 'Active';
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
      <Stack align="center" gap="md">
        <Badge size="lg" color={getStatusColor()} variant="filled">
          {getStatusText()}
        </Badge>
        
        <Text size="48px" fw={300} ff="monospace" style={{ letterSpacing: '0.1em' }}>
          {formatTime(timerState.elapsed_seconds)}
        </Text>

        {timerState.current_session_id && (
          <Text size="xs" c="dimmed" ff="monospace">
            Session: {timerState.current_session_id.substring(0, 8)}...
          </Text>
        )}
      </Stack>
    </Card>
  );
}
