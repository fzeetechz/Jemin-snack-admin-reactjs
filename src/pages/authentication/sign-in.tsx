/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  Alert,
  Button,
  Checkbox,
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
} from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { PATH_DASHBOARD, PATH_AUTH } from '../../constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/theme/themeSlice';
import { RootState } from '../../redux/store';
import { useAuth } from '../../hooks';
import { handleApiError } from '../../services/api/apiClient';
import AuthLeft from '../../components/auth/AuthLeft';

const { Title } = Typography;

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export const SignInPage = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);

    try {
      // Call the real authentication API
      await login({
        email: values.email!,
        password: values.password!,
      });

      message.success('Login successful! Welcome back.');

      // Redirect to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || PATH_DASHBOARD.default;
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const apiError = handleApiError(err);
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.';
      const errorMessage =
        apiError.message && apiError.message !== 'An unexpected error occurred'
          ? apiError.message
          : fallbackMessage;
      setError(errorMessage);
      message.error(errorMessage || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
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
      {/* <Col xs={24} lg={12}>
        <Flex
          className="auth-form-panel"
          vertical
          align="center"
          justify="center"
          className="text-center"
          style={{ backgroundImage: `url(https://as2.ftcdn.net/v2/jpg/02/58/86/97/1000_F_258869730_KSydnAki0M5lBLRthoTtCfIxkwhA5VzF.jpg)`, height: '100%', padding: '1rem' }}
        >
          <Logo color="white" />
          <Title level={2} className="text-white">
            Welcome back to  {STRINGS.PROJECT.NAME}
          </Title>
          <Text className="text-white" style={{ fontSize: 18 }}>
            A dynamic and versatile multipurpose dashboard utilizing Ant Design,
            React, TypeScript, and Vite.
          </Text>
        </Flex>
      </Col> */}
      <Col xs={24} lg={12}>
        <Flex
          className="auth-form-panel"
          vertical
          align={isMobile ? 'center' : 'flex-start'}
          justify="center"
          gap="middle"
          style={{
            height: '100%',
            padding: '2rem',
            background: colorBgContainer,
          }}
        >
          <Title className="m-0">Welcome back</Title>
          <span className="auth-form-description">Sign in to your Jemini Snacks workspace.</span>
          {/* <Flex gap={4}>
            <Text>Don't have an account?</Text>
            <Link href={PATH_AUTH.signup}>Create an account here</Link>
          </Flex> */}
          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ width: '100%' }}
            />
          )}
          <Form
            name="sign-up-form"
            layout="vertical"
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            initialValues={{
              email: 'admin@jemini.com',
              password: '12345678',
              // email: 'zonavahace@mailinator.com',
              // password: 'H12345678',

              remember: true,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            requiredMark={false}
          >
            <Row gutter={[8, 0]}>
              <Col xs={24}>
                <Form.Item<FieldType>
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item<FieldType>
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item<FieldType> name="remember" valuePropName="checked">
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Flex align="center" justify="space-between">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="middle"
                  loading={loading}
                >
                  Login
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={() => navigate(PATH_AUTH.passwordReset)}
                >
                  Forgot password?
                </Button>
              </Flex>
            </Form.Item>
          </Form>
          {/* <Divider className="m-0">or</Divider>
          <Flex
            vertical={isMobile}
            gap="small"
            wrap="wrap"
            style={{ width: '100%' }}
          >
            <Button icon={<GoogleOutlined />}>Sign in with Google</Button>
            <Button icon={<FacebookFilled />}>Sign in with Facebook</Button>
            <Button icon={<TwitterOutlined />}>Sign in with Twitter</Button>
          </Flex> */}
        </Flex>
      </Col>
    </Row>
  );
};
