import { ArrowLeft as ArrowLeftOutlined } from 'lucide-react';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Row,
  Switch,
  theme,
  Tooltip,
  Typography,
  Space,
  Spin,
} from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import AuthLeft from '../../components/auth/AuthLeft';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/theme/themeSlice';
import { RootState } from '../../redux/store';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

type FieldType = {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
};

export const PasswordResetPage = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { sendOtp, verifyOtpAndResetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [_form] = Form.useForm();

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      message.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email);
      if (res?.success) {
        message.success('OTP sent to your email');
        setStep('otp');
      } else {
        message.error(res?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      message.error('Please enter a valid OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAndResetPassword(email, otp, '');
      if (res?.success) {
        message.success('OTP verified');
        setStep('password');
      } else {
        message.error(res?.message || 'Invalid OTP');
      }
    } catch (error: any) {
      message.error(error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      message.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAndResetPassword(email, otp, password);
      if (res?.success) {
        message.success('Password updated successfully');
        setTimeout(() => {
          navigate(PATH_AUTH.signin);
        }, 1500);
      } else {
        message.error(res?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row
      className="auth-page"
      style={{
        minHeight: isMobile ? 'auto' : '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
      >
        <Tooltip title="Toggle theme">
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={mytheme === 'dark'}
            onClick={() => dispatch(toggleTheme())}
          />
        </Tooltip>
      </div>
      <AuthLeft />
      <Col xs={24} lg={12}>
        <Flex
          className="auth-form-panel"
          vertical
          align={isMobile ? 'center' : 'flex-start'}
          justify="center"
          gap="middle"
          style={{
            height: '100%',
            width: '100%',
            padding: '2rem',
            background: colorBgContainer,
          }}
        >
          <Flex align="center" gap="small">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_AUTH.signin)}
            />
            <Title className="m-0">Reset Password</Title>
          </Flex>

          <Text>
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'password' && 'Create a new password'}
          </Text>

          <Spin spinning={loading} style={{ width: '100%' }}>
            {step === 'email' && (
              <Form
                layout="vertical"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                autoComplete="off"
                requiredMark={false}
                style={{ width: '100%' }}
              >
                <Form.Item<FieldType>
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email' },
                    {
                      type: 'email',
                      message: 'Please enter a valid email',
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="middle"
                    loading={loading}
                    onClick={handleSendOtp}
                    disabled={!email || !email.includes('@')}
                    block
                  >
                    Send OTP
                  </Button>
                </Form.Item>
              </Form>
            )}

            {step === 'otp' && (
              <Form
                layout="vertical"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                autoComplete="off"
                requiredMark={false}
                style={{ width: '100%' }}
              >
                <Form.Item<FieldType>
                  label="OTP"
                  name="otp"
                  rules={[
                    { required: true, message: 'Please input the OTP' },
                    {
                      min: 4,
                      message: 'OTP must be at least 4 characters',
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter 4-6 digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                  />
                </Form.Item>
                <Form.Item>
                  <Space style={{ width: '100%' }} direction="vertical">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="middle"
                      loading={loading}
                      onClick={handleVerifyOtp}
                      disabled={!otp || otp.length < 4}
                      block
                    >
                      Verify OTP
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => setStep('email')}
                      disabled={loading}
                    >
                      Change Email
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}

            {step === 'password' && (
              <Form
                layout="vertical"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                autoComplete="off"
                requiredMark={false}
                style={{ width: '100%' }}
              >
                <Form.Item<FieldType>
                  label="New Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password' },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </Form.Item>
                <Form.Item<FieldType>
                  label="Confirm Password"
                  name="confirmPassword"
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    {
                      min: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="middle"
                    loading={loading}
                    onClick={handleResetPassword}
                    disabled={
                      !password ||
                      password.length < 6 ||
                      password !== confirmPassword
                    }
                    block
                  >
                    Reset Password
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Spin>
        </Flex>
      </Col>
    </Row>
  );
};
