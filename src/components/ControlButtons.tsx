import { Group, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTimerStore } from '../stores/timerStore';

export function ControlButtons() {
  const { timerState, startTimer, pauseTimer, resumeTimer, endTimer } = useTimerStore();

  const handleStart = async () => {
    try {
      await startTimer();
      notifications.show({ 
        title: 'Timer Started', 
        message: 'Time tracking has begun!',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to start:', error);
      notifications.show({ 
        title: 'Error', 
        message: 'Failed to start timer',
        color: 'red'
      });
    }
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
      notifications.show({ 
        title: 'Timer Paused', 
        message: 'Time tracking paused',
        color: 'yellow'
      });
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeTimer();
      notifications.show({ 
        title: 'Timer Resumed', 
        message: 'Time tracking resumed',
        color: 'blue'
      });
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  const handleEnd = async () => {
    try {
      await endTimer();
      notifications.show({ 
        title: 'Session Ended', 
        message: 'Session exported to Downloads folder!',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to end:', error);
    }
  };

  return (
    <Group justify="center" gap="sm">
      {!timerState.is_running && (
        <Button 
          onClick={handleStart} 
          color="green" 
          size="lg"
          fullWidth
        >
          Start
        </Button>
      )}

      {timerState.is_running && !timerState.is_paused && (
        <>
          <Button 
            onClick={handlePause} 
            color="yellow" 
            size="lg"
            style={{ flex: 1 }}
          >
            Pause
          </Button>
          <Button 
            onClick={handleEnd} 
            color="red" 
            size="lg"
            style={{ flex: 1 }}
          >
            End
          </Button>
        </>
      )}

      {timerState.is_running && timerState.is_paused && (
        <>
          <Button 
            onClick={handleResume} 
            color="blue" 
            size="lg"
            style={{ flex: 1 }}
          >
            Resume
          </Button>
          <Button 
            onClick={handleEnd} 
            color="red" 
            size="lg"
            style={{ flex: 1 }}
          >
            End
          </Button>
        </>
      )}
    </Group>
  );
}
