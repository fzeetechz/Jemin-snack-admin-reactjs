import { Trash2 as DeleteOutlined } from 'lucide-react';

import {
  Button,
  Calendar,
  Card,
  Empty,
  Flex,
  Input,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useHrSettingsContext } from './context';

const { Text } = Typography;

const HolidaysSettingsTab = () => {
  const {
    canDeleteSettings,
    deletingSetting,
    form,
    addHoliday,
    updateHoliday,
    removeHoliday,
  } = useHrSettingsContext();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const addHolidayFromCalendar = (value: Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    const existingIndex = form.holidays.findIndex(
      (holiday) => holiday.date === date
    );

    if (existingIndex >= 0) {
      setSelectedDate(value);
      return;
    }

    addHoliday();
    const nextIndex = form.holidays.length;
    updateHoliday(nextIndex, 'date', date);
    updateHoliday(nextIndex, 'name', `${value.format('DD MMM')} Holiday`);
    setSelectedDate(value);
  };

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card bordered={false}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Text strong style={{ display: 'block', fontSize: 16 }}>
              Holiday Calendar
            </Text>
            <Text type="secondary">
              Select dates directly from the calendar to create holidays, then
              edit the holiday names from the side panel.
            </Text>
          </div>
          <Tag color="purple">{form.holidays.length} holidays</Tag>
        </Flex>
      </Card>

      <Flex gap={16} wrap="wrap" align="stretch">
        <Card
          bordered={false}
          title="Pick Dates"
          style={{ flex: 2, minWidth: 320 }}
          bodyStyle={{ paddingTop: 8 }}
        >
          <Calendar
            value={selectedDate}
            onSelect={(value) => addHolidayFromCalendar(value)}
            fullscreen={false}
            cellRender={(current) => {
              const isHoliday = form.holidays.some(
                (holiday) => holiday.date === current.format('YYYY-MM-DD')
              );

              return isHoliday ? (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    margin: '0 auto',
                    borderRadius: 999,
                    background: '#ff4d4f',
                  }}
                />
              ) : null;
            }}
          />
        </Card>

        <Card
          bordered={false}
          title="Selected Holidays"
          style={{ flex: 1, minWidth: 320 }}
        >
          <Space direction="vertical" size={12} style={{ display: 'flex' }}>
            {form.holidays.length === 0 ? (
              <Empty description="Select a holiday from the calendar" />
            ) : null}

            {form.holidays.map((holiday, index) => (
              <Card
                key={`${holiday.date || 'holiday'}-${index}`}
                size="small"
                style={{ borderRadius: 14 }}
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={
                      deletingSetting || (!canDeleteSettings && !!holiday._id)
                    }
                    onClick={() => removeHoliday(index)}
                  />
                }
              >
                <Space
                  direction="vertical"
                  size={8}
                  style={{ display: 'flex' }}
                >
                  <Tag color="red" style={{ width: 'fit-content', margin: 0 }}>
                    {holiday.date
                      ? dayjs(holiday.date).format('DD MMM YYYY')
                      : 'No date'}
                  </Tag>
                  <Input
                    placeholder="Holiday name"
                    value={holiday.name}
                    onChange={(event) =>
                      updateHoliday(index, 'name', event.target.value)
                    }
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Flex>
    </Space>
  );
};

export default HolidaysSettingsTab;
