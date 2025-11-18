import { useEffect, useState } from 'react';
import { Stack, Card, Text, Group, Select, Button, Table, Grid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTimerStore } from '../stores/timerStore';

export function SummaryPage() {
  const { monthlySummary, fetchMonthlySummary, exportMonthlySummary } = useTimerStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchMonthlySummary(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchMonthlySummary]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const path = await exportMonthlySummary(selectedYear, selectedMonth);
      notifications.show({
        title: 'Export Complete',
        message: `Monthly summary exported to: ${path}`,
        color: 'green'
      });
    } catch (error) {
      console.error('Export failed:', error);
      notifications.show({
        title: 'Export Failed',
        message: 'Could not export monthly summary',
        color: 'red'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="xl" fw={600} mb="md">Monthly Summary</Text>

        <Group grow mb="md">
          <Select
            value={String(selectedMonth)}
            onChange={(value) => setSelectedMonth(Number(value))}
            data={months.map((month, index) => ({
              value: String(index + 1),
              label: month
            }))}
            label="Month"
          />

          <Select
            value={String(selectedYear)}
            onChange={(value) => setSelectedYear(Number(value))}
            data={years.map((year) => ({
              value: String(year),
              label: String(year)
            }))}
            label="Year"
          />
        </Group>

        <Button
          onClick={handleExport}
          disabled={isExporting || !monthlySummary || monthlySummary.session_count === 0}
          loading={isExporting}
          color="blue"
          fullWidth
        >
          Export to Excel
        </Button>
      </Card>

      {monthlySummary ? (
        <>
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" mb="xs">Total Sessions</Text>
                <Text size="xl" fw={700}>{monthlySummary.session_count}</Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" mb="xs">Total Time</Text>
                <Text size="xl" fw={700}>{formatDuration(monthlySummary.total_seconds)}</Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={4}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" mb="xs">Regular Hours</Text>
                <Text size="xl" fw={700} c="blue">{monthlySummary.regular_hours.toFixed(1)}h</Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={4}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" mb="xs">Overtime Hours</Text>
                <Text size="xl" fw={700} c="orange">{monthlySummary.overtime_hours.toFixed(1)}h</Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={4}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" mb="xs">Longest Session</Text>
                <Text size="xl" fw={700}>{formatDuration(monthlySummary.longest_session_seconds)}</Text>
              </Card>
            </Grid.Col>
          </Grid>

          {monthlySummary.weekly_breakdown && monthlySummary.weekly_breakdown.length > 0 && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="lg" fw={600} mb="md">Weekly Breakdown (40h = Regular, &gt;40h = Overtime)</Text>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Week</Table.Th>
                    <Table.Th>Sessions</Table.Th>
                    <Table.Th>Total Hours</Table.Th>
                    <Table.Th>Regular Hours</Table.Th>
                    <Table.Th>Overtime Hours</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {monthlySummary.weekly_breakdown.map((week, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{week.week_start}</Table.Td>
                      <Table.Td>{week.session_count}</Table.Td>
                      <Table.Td fw={600}>{week.total_hours.toFixed(1)}h</Table.Td>
                      <Table.Td c="blue">{week.regular_hours.toFixed(1)}h</Table.Td>
                      <Table.Td c={week.overtime_hours > 0 ? 'orange' : 'gray'} fw={week.overtime_hours > 0 ? 700 : 400}>
                        {week.overtime_hours.toFixed(1)}h
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {monthlySummary.daily_breakdown.length > 0 ? (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="lg" fw={600} mb="md">Daily Breakdown</Text>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Sessions</Table.Th>
                    <Table.Th>Total Time</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {monthlySummary.daily_breakdown.map((day) => (
                    <Table.Tr key={day.date}>
                      <Table.Td>{day.date}</Table.Td>
                      <Table.Td>{day.session_count}</Table.Td>
                      <Table.Td>{formatDuration(day.total_seconds)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center">
                No sessions recorded for {months[selectedMonth - 1]} {selectedYear}
              </Text>
            </Card>
          )}
        </>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text c="dimmed" ta="center">Loading summary...</Text>
        </Card>
      )}
    </Stack>
  );
}
