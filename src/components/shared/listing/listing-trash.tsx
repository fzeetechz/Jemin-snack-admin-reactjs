import { Space } from 'antd';
import type { ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';

/** Keep Delete next to Edit/View, visible at the right edge of wide tables. */
export function withTrashActions<T extends object>(
  columns: ColumnsType<T>,
  renderDelete: (row: T) => ReactNode
): ColumnsType<T> {
  let found = false;
  const result: ColumnsType<T> = columns.map((column) => {
    if (
      'children' in column ||
      (column.key !== 'actions' && column.title !== 'Actions')
    )
      return column;
    found = true;
    return {
      ...column,
      fixed: 'right' as const,
      width: column.width ? Number(column.width) + 48 : 260,
      render: (value: unknown, row: T, index: number) => (
        <Space size={4}>
          {column.render?.(value, row, index) as ReactNode}
          {renderDelete(row)}
        </Space>
      ),
    };
  });
  if (!found)
    result.push({
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_: unknown, row: T) => renderDelete(row),
    });
  // Ant Design needs the fixed right action after any scrollable details column.
  const actionIndex = result.findIndex(
    (column) => column.key === 'actions' || column.title === 'Actions'
  );
  if (actionIndex >= 0 && actionIndex !== result.length - 1) {
    const [action] = result.splice(actionIndex, 1);
    result.push(action);
  }
  return result;
}
