import { Card, Empty, Typography } from 'antd';

export const CorporateFaqPage = () => (
  <div className="module-page">
    <Typography.Title level={3}>Frequently asked questions</Typography.Title>
    <Card>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="FAQs are not available yet."
      />
    </Card>
  </div>
);
