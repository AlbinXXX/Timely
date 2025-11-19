import { useEffect } from 'react';
import { Card, Text, Badge, Stack } from '@mantine/core';
import { useTimerStore } from '../stores/timerStore';

export function TimerDisplay() {
  const { timerState, refreshTimerState } = useTimerStore();

  useEffect(() => {
    refreshTimerState();
    const interval = setInterval(() => {
      refreshTimerState();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshTimerState]);

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
