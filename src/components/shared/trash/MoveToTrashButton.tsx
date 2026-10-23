import { useRef, useState } from 'react';
import { Button, Modal, Tooltip, message } from 'antd';
import { Trash2 } from 'lucide-react';
import { trashService } from '../../../services/trashService';
import type { ButtonProps } from 'antd';

interface MoveToTrashButtonProps
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'id'> {
  recordId?: string;
  modelType: string;
  recordName?: string;
  disabledReason?: string;
  onMoved: () => void | Promise<unknown>;
}

export default function MoveToTrashButton({
  recordId,
  modelType,
  recordName,
  disabledReason,
  onMoved,
  disabled,
  children,
  ...props
}: MoveToTrashButtonProps) {
  const [moving, setMoving] = useState(false);
  const pending = useRef(false);
  return (
    <Tooltip
      title={
        disabledReason ??
        (!recordId
          ? 'This record has no saved ID and cannot be moved to Trash.'
          : undefined)
      }
    >
      <span>
        <Button
          size="small"
          danger
          icon={<Trash2 size={15} />}
          aria-label="Move to Trash"
          title="Move to Trash"
          {...props}
          loading={moving}
          disabled={disabled || !!disabledReason || !recordId || moving}
          onClick={(event) => {
            event.stopPropagation();
            if (disabled || disabledReason || !recordId || pending.current)
              return;
            Modal.confirm({
              title: `Move ${
                recordName ? `"${recordName}"` : 'this record'
              } to Trash?`,
              content: 'You can restore it later from the Trash page.',
              okText: 'Move to Trash',
              okButtonProps: { danger: true },
              onOk: async () => {
                if (pending.current) return;
                pending.current = true;
                setMoving(true);
                try {
                  try {
                    await trashService.move(recordId, modelType);
                  } catch (error) {
                    message.error(
                      error instanceof Error
                        ? error.message
                        : 'Unable to move record to Trash'
                    );
                    throw error;
                  }
                  message.success('Moved to Trash');
                  try {
                    await onMoved();
                  } catch {
                    message.warning(
                      'Moved to Trash. Refresh the page to update the remaining records.'
                    );
                  }
                } finally {
                  pending.current = false;
                  setMoving(false);
                }
              },
            });
          }}
        >
          {children}
        </Button>
      </span>
    </Tooltip>
  );
}
