import React, { ReactNode } from 'react';
import { Breadcrumb, BreadcrumbProps, Typography } from 'antd';

import './styles.css';

type Props = {
  title: string;
  breadcrumbs: BreadcrumbProps['items'];
  extra?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const PageHeader = ({ breadcrumbs, title, extra, ...others }: Props) => {
  return (
    <div {...others} className={`route-page-header ${others.className ?? ''}`}>
      <Breadcrumb items={breadcrumbs} className="page-header-breadcrumbs" />
      {(title || extra) && (
        <div className="route-page-header-row">
          {title && (
            <Typography.Title
              level={4}
              style={{ margin: 0, textTransform: 'capitalize' }}
            >
              {title}
            </Typography.Title>
          )}
          {extra}
        </div>
      )}
    </div>
  );
};
