import { useState } from 'react';
import { Stack, Button, Text, Group, Card, Badge, Progress, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTimerStore } from '../stores/timerStore';

export function StressTest() {
  const { startTimer, pauseTimer, resumeTimer, endTimer, timerState } = useTimerStore();
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const runStressTest = async () => {
    setTestRunning(true);
    setTestResults([]);
    setProgress(0);
    const results: any[] = [];

    try {
      // Test 1: Start Timer
      setProgress(10);
      notifications.show({ message: 'Test 1: Starting timer...', color: 'blue' });
      const startTime = Date.now();
      await startTimer();
      results.push({ test: 'Start Timer', time: Date.now() - startTime, status: 'pass' });
      await new Promise(r => setTimeout(r, 2000));

      // Test 2: Pause Timer
      setProgress(25);
      notifications.show({ message: 'Test 2: Pausing timer...', color: 'blue' });
      const pauseTime = Date.now();
      await pauseTimer();
      results.push({ test: 'Pause Timer', time: Date.now() - pauseTime, status: 'pass' });
      await new Promise(r => setTimeout(r, 1000));

      // Test 3: Resume Timer
      setProgress(40);
      notifications.show({ message: 'Test 3: Resuming timer...', color: 'blue' });
      const resumeTime = Date.now();
      await resumeTimer();
      results.push({ test: 'Resume Timer', time: Date.now() - resumeTime, status: 'pass' });
      await new Promise(r => setTimeout(r, 2000));

      // Test 4: Multiple Pause/Resume Cycles
      setProgress(55);
      notifications.show({ message: 'Test 4: Multiple pause/resume cycles...', color: 'blue' });
      for (let i = 0; i < 3; i++) {
        await pauseTimer();
        await new Promise(r => setTimeout(r, 500));
        await resumeTimer();
        await new Promise(r => setTimeout(r, 500));
      }
      results.push({ test: 'Multiple Pause/Resume (3x)', time: 3000, status: 'pass' });

      // Test 5: End Session
      setProgress(75);
      notifications.show({ message: 'Test 5: Ending session...', color: 'blue' });
      const endTime = Date.now();
      await endTimer();
      results.push({ test: 'End Session & Export', time: Date.now() - endTime, status: 'pass' });

      // Test 6: Start New Session
      setProgress(90);
      notifications.show({ message: 'Test 6: Starting new session...', color: 'blue' });
      await new Promise(r => setTimeout(r, 1000));
      const newStartTime = Date.now();
      await startTimer();
      results.push({ test: 'Start New Session', time: Date.now() - newStartTime, status: 'pass' });
      await new Promise(r => setTimeout(r, 500));
      
      // Clean up - end the test session
      await endTimer();

      setProgress(100);
      notifications.show({ 
        title: 'Stress Test Complete!', 
        message: 'All tests passed successfully', 
        color: 'green' 
      });

    } catch (error: any) {
      results.push({ 
        test: 'Error occurred', 
        time: 0, 
        status: 'fail', 
        error: error.message 
      });
      notifications.show({ 
        title: 'Test Failed', 
        message: error.message, 
        color: 'red' 
      });
    }

    setTestResults(results);
    setTestRunning(false);
  };

  const runQuickTests = async () => {
    const tests = [
      { name: 'Start Timer', fn: startTimer },
      { name: 'Pause Timer', fn: pauseTimer },
      { name: 'Resume Timer', fn: resumeTimer },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        notifications.show({ message: `✓ ${test.name}`, color: 'green' });
        await new Promise(r => setTimeout(r, 500));
      } catch (error: any) {
        notifications.show({ message: `✗ ${test.name}: ${error}`, color: 'red' });
      }
    }

    // Clean up
    try {
      await endTimer();
    } catch (e) {
      // Ignore cleanup errors
    }
  };

  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="lg" fw={600} mb="md">Stress Test Suite</Text>
        
        <Alert color="blue" title="Test Information" mb="md">
          This will automatically test all timer functions: start, pause, resume, multiple cycles, and end with export.
        </Alert>

        <Group gap="sm" mb="md">
          <Button 
            onClick={runStressTest} 
            disabled={testRunning || timerState.is_running}
            loading={testRunning}
            color="blue"
          >
            Run Full Stress Test
          </Button>
          
          <Button 
            onClick={runQuickTests}
            disabled={testRunning}
            variant="light"
            color="cyan"
          >
            Quick Test (Start/Pause/Resume)
          </Button>
        </Group>

        {testRunning && (
          <Progress 
            value={progress} 
            animated 
            color="blue" 
            size="lg" 
            mb="md"
          />
        )}

        {testResults.length > 0 && (
          <Stack gap="xs" mt="md">
            <Text size="sm" fw={600}>Test Results:</Text>
            {testResults.map((result, idx) => (
              <Card key={idx} padding="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm">{result.test}</Text>
                  <Group gap="xs">
                    <Badge color={result.status === 'pass' ? 'green' : 'red'}>
                      {result.status}
                    </Badge>
                    <Text size="xs" c="dimmed">{result.time}ms</Text>
                  </Group>
                </Group>
                {result.error && (
                  <Text size="xs" c="red" mt="xs">{result.error}</Text>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="lg" fw={600} mb="md">Current Timer State</Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Running:</Text>
            <Badge color={timerState.is_running ? 'green' : 'gray'}>
              {timerState.is_running ? 'Yes' : 'No'}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Paused:</Text>
            <Badge color={timerState.is_paused ? 'yellow' : 'gray'}>
              {timerState.is_paused ? 'Yes' : 'No'}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Elapsed:</Text>
            <Text size="sm" ff="monospace">{timerState.elapsed_seconds}s</Text>
          </Group>
          {timerState.current_session_id && (
            <Group justify="space-between">
              <Text size="sm">Session ID:</Text>
              <Text size="xs" ff="monospace">{timerState.current_session_id.substring(0, 12)}...</Text>
            </Group>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
