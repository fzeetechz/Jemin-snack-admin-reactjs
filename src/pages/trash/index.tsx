import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { trashRecordModule, trashService } from '../../services/trashService';
import { usePermissions } from '../../hooks/usePermissions';
import type { TrashModel, TrashRecord } from '../../services/trashService';

const TrashPage = () => {
  const [rows, setRows] = useState<TrashRecord[]>([]);
  const [models, setModels] = useState<TrashModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [model, setModel] = useState<string>();
  const [selected, setSelected] = useState<React.Key[]>([]);
  const { canRead, canUpdate, canDelete } = usePermissions();
  const canView = (row: TrashRecord) =>
    canRead('trash') || canRead(trashRecordModule(row));
  const canRestore = (row: TrashRecord) =>
    canUpdate('trash') ||
    (canRead(trashRecordModule(row)) && canUpdate(trashRecordModule(row)));
  const canRemove = (row: TrashRecord) =>
    canDelete('trash') ||
    (canRead(trashRecordModule(row)) && canDelete(trashRecordModule(row)));
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [items, types] = await Promise.all([
        trashService.list(),
        trashService.models(),
      ]);
      setRows(items);
      setModels(types);
      setSelected([]);
    } catch (err) {
      setRows([]);
      setSelected([]);
      setError(err instanceof Error ? err.message : 'Unable to load Trash');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = rows.filter(canView);
  const filtered = visible.filter(
    (row) =>
      (!model ||
        (row.source === 'device'
          ? model === 'device-contract'
          : row.modelType === model)) &&
      [row.name, row.originalId, row._id, row.modelType].some((value) =>
        value.toLowerCase().includes(search.toLowerCase().trim())
      )
  );
  const options = useMemo(() => {
    const map = new Map(models.map((item) => [item.value, item.label]));
    rows.forEach((row) =>
      map.set(
        row.source === 'device' ? 'device-contract' : row.modelType,
        row.source === 'device'
          ? 'Contracts (this device)'
          : map.get(row.modelType) ?? row.modelType
      )
    );
    return [...map].map(([value, label]) => ({ value, label }));
  }, [models, rows]);
  const selectedRows = filtered.filter((row) => selected.includes(row._id));
  const run = async (action: () => Promise<unknown>, success: string) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try {
      await action();
      message.success(success);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Trash operation failed'
      );
    } finally {
      await load();
      setBusy(false);
      actionLock.current = false;
    }
  };
  const confirm = (items: TrashRecord[], restore: boolean) => {
    if (
      !items.length ||
      items.some((row) => (restore ? !canRestore(row) : !canRemove(row)))
    )
      return;
    const ids = items.map((row) => row._id);
    Modal.confirm({
      title: `${restore ? 'Restore' : 'Permanently delete'} ${
        ids.length
      } record(s)?`,
      content: restore
        ? 'These records will return to their original pages.'
        : 'These records will be permanently deleted and cannot be restored.',
      okText: restore ? 'Restore' : 'Delete permanently',
      okButtonProps: { danger: !restore },
      onOk: () =>
        run(
          () =>
            restore ? trashService.restore(ids) : trashService.permanent(ids),
          restore
            ? 'Restore request completed'
            : 'Permanent delete request completed'
        ),
    });
  };
  // Empty Trash affects every record in its scope, so it requires Trash-wide delete access.
  const empty = () =>
    Modal.confirm({
      title: model
        ? `Empty Trash for ${
            options.find((item) => item.value === model)?.label ?? model
          }?`
        : 'Empty all Trash?',
      content:
        'Every record in this scope will be permanently deleted, including records outside the current search. This cannot be undone.',
      okText: 'Empty Trash',
      okButtonProps: { danger: true },
      onOk: () => run(() => trashService.empty(model), 'Trash emptied'),
    });
  return (
    <div className="module-page">
      <Flex
        justify="space-between"
        align="center"
        wrap
        gap={12}
        style={{ marginBottom: 16 }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Trash
          </Typography.Title>
          <Typography.Text type="secondary">
            Restore deleted records to their original pages or delete them
            permanently.
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            disabled={busy}
            onClick={() => void load()}
          >
            Refresh
          </Button>
          {canDelete('trash') && (
            <Button
              danger
              icon={<Trash2 size={16} />}
              disabled={busy || loading || !!error}
              onClick={empty}
            >
              Empty Trash
            </Button>
          )}
        </Space>
      </Flex>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Unable to load Trash"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Flex
          wrap
          gap={12}
          justify="space-between"
          style={{ marginBottom: 16 }}
        >
          <Space wrap>
            <Input.Search
              placeholder="Search name or ID"
              allowClear
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected([]);
              }}
              style={{ width: 260 }}
            />
            <Select
              aria-label="Filter by model"
              placeholder="All models"
              allowClear
              showSearch
              optionFilterProp="label"
              options={options}
              value={model}
              style={{ minWidth: 200 }}
              onChange={(value) => {
                setModel(value);
                setSelected([]);
              }}
            />
          </Space>
          <Space wrap>
            <Typography.Text>{selectedRows.length} selected</Typography.Text>
            <Button
              icon={<RotateCcw size={16} />}
              aria-label="Restore selected records"
              title="Restore selected records"
              disabled={
                busy ||
                loading ||
                !selectedRows.length ||
                !selectedRows.every(canRestore)
              }
              onClick={() => confirm(selectedRows, true)}
            />
            <Button
              danger
              icon={<Trash2 size={16} />}
              aria-label="Delete selected permanently"
              title="Delete selected permanently"
              disabled={
                busy ||
                loading ||
                !selectedRows.length ||
                !selectedRows.every(canRemove)
              }
              onClick={() => confirm(selectedRows, false)}
            />
          </Space>
        </Flex>
        <Table<TrashRecord>
          rowKey="_id"
          loading={loading || busy}
          dataSource={filtered}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys),
            getCheckboxProps: (row) => ({
              disabled: busy || (!canRestore(row) && !canRemove(row)),
            }),
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} records`,
          }}
          columns={[
            { title: 'Record', dataIndex: 'name' },
            {
              title: 'Deleted at',
              dataIndex: 'deletedAt',
              render: (value: string) =>
                value && dayjs(value).isValid()
                  ? dayjs(value).format('DD MMM YYYY, hh:mm A')
                  : '-',
              sorter: (a, b) =>
                (Date.parse(a.deletedAt) || 0) - (Date.parse(b.deletedAt) || 0),
              defaultSortOrder: 'descend',
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, row) => (
                <Space>
                  {canRestore(row) && (
                    <Button
                      size="small"
                      icon={<RotateCcw size={15} />}
                      aria-label="Restore record"
                      title="Restore"
                      disabled={busy}
                      onClick={() => confirm([row], true)}
                    />
                  )}
                  {canRemove(row) && (
                    <Button
                      size="small"
                      danger
                      icon={<Trash2 size={15} />}
                      aria-label="Delete permanently"
                      title="Delete permanently"
                      disabled={busy}
                      onClick={() => confirm([row], false)}
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
export default TrashPage;
