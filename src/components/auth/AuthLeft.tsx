import { Col } from 'antd';
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleCheck,
  Package,
  UsersRound,
} from 'lucide-react';
import { Logo } from '../shared';
import './auth.css';

const AuthLeft = () => (
  <Col xs={24} lg={12} className="auth-brand-column">
    <section className="auth-brand-panel">
      <div className="auth-brand-logo">
        <Logo color="white" imgSize={{ h: 42 }} />
      </div>
      <div className="auth-brand-content">
        <span className="auth-eyebrow">THE JEMINI WORKSPACE</span>
        <h1>
          Good people.
          <br />
          Great business.
        </h1>
        <p>
          A little more clarity. A lot more possibility. Bring your customers,
          team and everyday work together.
        </p>
        <div className="auth-workspace-illustration" aria-hidden="true">
          <div className="auth-preview-heading">
            <span className="auth-preview-mark">
              <ChartNoAxesCombined size={17} />
            </span>
            <span>Your business, in focus</span>
            <ArrowUpRight size={16} />
          </div>
          <div className="auth-preview-chart">
            {[35, 52, 42, 65, 54, 78, 68, 93, 83, 100].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="auth-preview-divider" />
          <div className="auth-preview-row">
            <span>
              <UsersRound size={15} /> Customer relationships
            </span>
            <CircleCheck size={16} />
          </div>
          <div className="auth-preview-row">
            <span>
              <Package size={15} /> Orders & operations
            </span>
            <CircleCheck size={16} />
          </div>
        </div>
      </div>
      <div className="auth-brand-footer">
        <span>Made for the way you work.</span>
        <span>Jemini Snacks</span>
      </div>
    </section>
  </Col>
);

export default AuthLeft;
