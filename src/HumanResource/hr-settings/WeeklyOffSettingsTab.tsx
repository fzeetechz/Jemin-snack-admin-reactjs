import { Trash2 as DeleteOutlined, Plus as PlusOutlined } from 'lucide-react';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Flex,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  MONTHLY_OFF_WEEKS,
  WEEK_DAYS,
  type HrMonthlyOffPattern,
} from './types';
import { useHrSettingsContext } from './context';

const { Text } = Typography;

const weekOptions = MONTHLY_OFF_WEEKS.map((week) => ({
  label: week.charAt(0).toUpperCase() + week.slice(1),
  value: week,
}));

const dayOptions = WEEK_DAYS.map((day) => ({
  label: day,
  value: day,
}));

const WeeklyOffSettingsTab = () => {
  const {
    form,
    toggleWeeklyOff,
    addMonthlyOffPattern,
    updateMonthlyOffPattern,
    removeMonthlyOffPattern,
  } = useHrSettingsContext();

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card
        bordered={false}
        title="Fixed Weekly Offs"
        extra={
          <Tag color="blue">
            {form.weeklyOffPolicy.fixedDays.length} selected
          </Tag>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Pick the standard weekly off days that apply every week.
        </Text>
        <Flex wrap="wrap" gap={12}>
          {WEEK_DAYS.map((day) => (
            <Card
              key={day}
              hoverable
              size="small"
              onClick={() => toggleWeeklyOff(day)}
              style={{
                width: 122,
                cursor: 'pointer',
                borderRadius: 14,
                borderColor: form.weeklyOffPolicy.fixedDays.includes(day)
                  ? '#1677ff'
                  : '#f0f0f0',
                background: form.weeklyOffPolicy.fixedDays.includes(day)
                  ? '#f0f7ff'
                  : '#fff',
              }}
            >
              <Checkbox
                checked={form.weeklyOffPolicy.fixedDays.includes(day)}
                onChange={() => toggleWeeklyOff(day)}
              >
                {day}
              </Checkbox>
            </Card>
          ))}
        </Flex>
      </Card>

      <Card
        bordered={false}
        title="Monthly Off Patterns"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addMonthlyOffPattern}
          >
            Add Pattern
          </Button>
        }
      >
        <Space direction="vertical" size={12} style={{ display: 'flex' }}>
          <Text type="secondary">
            Use smart patterns for cases like 2nd Saturday off, 4th Saturday
            off, or last Friday off.
          </Text>

          {form.weeklyOffPolicy.monthlyPatterns.length === 0 ? (
            <Empty description="No monthly off patterns added" />
          ) : null}

          {form.weeklyOffPolicy.monthlyPatterns.map((pattern, index) => (
            <Card
              key={`${pattern.week}-${pattern.day}-${index}`}
              size="small"
              bodyStyle={{ paddingBottom: 8 }}
              extra={
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeMonthlyOffPattern(index)}
                >
                  Remove
                </Button>
              }
            >
              <Row gutter={12} align="middle">
                <Col xs={24} md={10}>
                  <Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 6 }}
                  >
                    Week
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={pattern.week}
                    options={weekOptions}
                    onChange={(value) =>
                      updateMonthlyOffPattern(
                        index,
                        'week',
                        value as HrMonthlyOffPattern['week']
                      )
                    }
                  />
                </Col>
                <Col xs={24} md={10}>
                  <Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 6 }}
                  >
                    Day
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={pattern.day}
                    options={dayOptions}
                    onChange={(value) =>
                      updateMonthlyOffPattern(index, 'day', value)
                    }
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Tag color="geekblue">Rule {index + 1}</Tag>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>
    </Space>
  );
};

export default WeeklyOffSettingsTab;
