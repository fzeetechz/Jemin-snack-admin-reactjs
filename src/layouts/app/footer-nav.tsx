import { Layout } from 'antd';
import { Link } from 'react-router-dom';

const { Footer } = Layout;
type FooterNavProps = React.HTMLAttributes<HTMLDivElement>;

const FooterNav = (props: FooterNavProps) => (
  <Footer {...props}>
    <div className="workspace-footer-inner">
      <span>
        &copy; {new Date().getFullYear()} <strong>Jemini Snacks</strong>. All
        rights reserved.
      </span>
      <nav className="workspace-footer-links" aria-label="Footer">
        <Link to="/privacy-policy">Privacy policy</Link>
        <Link to="/terms">Terms & conditions</Link>
        <a href="mailto:support@jeminicrm.com">Contact support</a>
      </nav>
    </div>
  </Footer>
);

export default FooterNav;
