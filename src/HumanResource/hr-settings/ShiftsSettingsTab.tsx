import { Trash2 as DeleteOutlined, Plus as PlusOutlined } from 'lucide-react';

import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useHrSettingsContext } from './context';

const { Text } = Typography;

const ShiftsSettingsTab = () => {
  const { form, addShift, updateShift, removeShift } = useHrSettingsContext();

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card
        bordered={false}
        style={{ background: '#fcfcfc' }}
        bodyStyle={{ paddingBottom: 12 }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Text strong style={{ display: 'block', fontSize: 16 }}>
              Shift Templates
            </Text>
            <Text type="secondary">
              Define reusable working-hour templates for teams, departments, or
              role-based schedules.
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={addShift}>
            New Shift
          </Button>
        </Flex>
      </Card>

      {form.shifts.length === 0 ? (
        <Empty description="No shifts added" />
      ) : null}

      {form.shifts.map((shift, index) => (
        <Card
          key={`${shift.name || 'shift'}-${index}`}
          bordered={false}
          title={
            <Flex vertical gap={2}>
              <Text strong>{shift.name || `Shift ${index + 1}`}</Text>
              <Text type="secondary">
                {shift.startTime || '--:--'} to {shift.endTime || '--:--'} •
                Break {shift.breakTimeMinutes} min
              </Text>
            </Flex>
          }
          extra={
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => removeShift(index)}
            >
              Remove
            </Button>
          }
          style={{ border: '1px solid #f0f0f0', borderRadius: 18 }}
        >
          <Form layout="vertical">
            <Row gutter={[16, 8]}>
              <Col xs={24} lg={9}>
                <Form.Item label="Shift Name">
                  <Input
                    placeholder="Morning / Night / Sales Team"
                    value={shift.name}
                    onChange={(event) =>
                      updateShift(index, 'name', event.target.value)
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Start Time">
                  <TimePicker
                    format="HH:mm"
                    value={
                      shift.startTime ? dayjs(shift.startTime, 'HH:mm') : null
                    }
                    onChange={(_, timeString) =>
                      updateShift(index, 'startTime', String(timeString || ''))
                    }
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="End Time">
                  <TimePicker
                    format="HH:mm"
                    value={shift.endTime ? dayjs(shift.endTime, 'HH:mm') : null}
                    onChange={(_, timeString) =>
                      updateShift(index, 'endTime', String(timeString || ''))
                    }
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Break Minutes">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={shift.breakTimeMinutes}
                    onChange={(value) =>
                      updateShift(index, 'breakTimeMinutes', Number(value || 0))
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ))}
    </Space>
  );
};

export default ShiftsSettingsTab;
