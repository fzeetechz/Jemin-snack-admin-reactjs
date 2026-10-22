import { Save as SaveOutlined } from 'lucide-react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  Button,
  Modal,
  Card,
  Flex,
  Typography,
  message,
  Tooltip,
  Divider,
  Space,
  Progress,
  Segmented,
  theme,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { trashService } from '../services/trashService';
import CompanySettingsTab from './hr-settings/CompanySettingsTab';
import HolidaysSettingsTab from './hr-settings/HolidaysSettingsTab';
import LeavePolicySettingsTab from './hr-settings/LeavePolicySettingsTab';
import SalaryRulesSettingsTab from './hr-settings/SalaryRulesSettingsTab';
import ShiftsSettingsTab from './hr-settings/ShiftsSettingsTab';
import WeeklyOffSettingsTab from './hr-settings/WeeklyOffSettingsTab';
import { HrSettingsContext } from './hr-settings/context';
import { useHrSettings } from '../zustand';
import {
  DEFAULT_HR_SETTINGS_FORM,
  HR_SETTINGS_TABS,
  type HrHoliday,
  type HrSalaryRules,
  type HrSettingsContextValue,
  type HrSettingsForm,
  type HrShift,
} from './hr-settings/types';
import { usePermissions } from 'src/hooks';

const { Title, Text } = Typography;
const { useToken } = theme;

const weekNumberMap: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  last: 5,
};

const weekLabelMap: Record<
  number,
  'first' | 'second' | 'third' | 'fourth' | 'last'
> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'last',
};

const tabMeta: Record<
  string,
  {
    title: string;
    description: string;
    tag: string;
    icon: React.ReactNode;
    color: string;
    progress?: number;
  }
> = {
  company: {
    title: 'Company Profile',
    description:
      'Business identity, working structure, and organization defaults.',
    tag: 'Identity',
    icon: <TeamOutlined />,
    color: '#1677ff',
  },
  shifts: {
    title: 'Shift Planner',
    description:
      'Define active shift windows, timing rules, and break durations.',
    tag: 'Attendance',
    icon: <ClockCircleOutlined />,
    color: '#52c41a',
  },
  'weekly-offs': {
    title: 'Weekly Off Rules',
    description: 'Manage fixed off days and recurring week-based patterns.',
    tag: 'Roster',
    icon: <CalendarOutlined />,
    color: '#fa8c16',
  },
  holidays: {
    title: 'Holiday Calendar',
    description: 'Maintain organization-wide non-working dates and exceptions.',
    tag: 'Calendar',
    icon: <CalendarOutlined />,
    color: '#eb2f96',
  },
  'salary-rules': {
    title: 'Salary Rules',
    description:
      'Configure monthly working days, overtime rules, and late penalties.',
    tag: 'Payroll',
    icon: <DollarOutlined />,
    color: '#13c2c2',
  },
  'leave-policy': {
    title: 'Leave Policy',
    description: 'Set default leave balances and leave distribution rules.',
    tag: 'Policy',
    icon: <CheckCircleOutlined />,
    color: '#722ed1',
  },
};

const HrSettings = () => {
  const { token } = useToken();
  const {
    hrSettings,
    shifts,
    weeklyOffs,
    holidays,
    leavePolicies,
    loading,
    fetchAll,
    saveSettings,
    createShift,
    updateShift: updateShiftApi,
    createWeeklyOff,
    updateWeeklyOff,
    createHoliday,
    updateHoliday: updateHolidayApi,
    createLeavePolicy,
    updateLeavePolicy,
  } = useHrSettings();
  const [form, setForm] = useState<HrSettingsForm>(DEFAULT_HR_SETTINGS_FORM);
  const [activeKey, setActiveKey] = useState('company');
  const [savingProgress, setSavingProgress] = useState<number | null>(null);

  const { canUpdate, canDelete } = usePermissions();
  const deletingIds = useRef(new Set<string>());
  const [deletingSetting, setDeletingSetting] = useState(false);
  const moveSavedSetting = (
    id: string | undefined,
    model: string,
    remove: () => void
  ) => {
    if (!id) {
      remove();
      return;
    }
    if (!canDelete('settings') || deletingIds.current.has(id)) return;
    Modal.confirm({
      title: 'Move this setting to Trash?',
      content:
        'This takes effect immediately. You can restore it from the Trash page.',
      okText: 'Move to Trash',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (deletingIds.current.has(id)) return;
        deletingIds.current.add(id);
        setDeletingSetting(true);
        try {
          await trashService.move(id, model);
          remove();
          message.success('Moved to Trash');
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : 'Unable to move setting to Trash'
          );
          throw error;
        } finally {
          deletingIds.current.delete(id);
          setDeletingSetting(deletingIds.current.size > 0);
        }
      },
    });
  };
  const activeSection = tabMeta[activeKey] ?? tabMeta.company;

  const setCompanyName = (value: string) => {
    setForm((prev) => ({ ...prev, companyName: value }));
  };

  const addShift = () => {
    setForm((prev) => ({
      ...prev,
      shifts: [
        ...prev.shifts,
        { name: '', startTime: '', endTime: '', breakTimeMinutes: 60 },
      ],
    }));
  };

  const updateShift = (
    index: number,
    key: keyof HrShift,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      shifts: prev.shifts.map((shift, shiftIndex) =>
        shiftIndex === index ? { ...shift, [key]: value } : shift
      ),
    }));
  };

  const removeShift = (index: number) => {
    const item = form.shifts[index];
    if (!item) return;
    moveSavedSetting(item._id, 'shift', () =>
      setForm((prev) => ({
        ...prev,
        shifts: prev.shifts.filter((row) =>
          item._id ? row._id !== item._id : row !== item
        ),
      }))
    );
  };

  const removeWeeklyOffPolicy = () =>
    moveSavedSetting(form.weeklyOffPolicy._id, 'weeklyOff', () => {
      setForm((prev) => ({
        ...prev,
        weeklyOffPolicy: { fixedDays: [], monthlyPatterns: [] },
      }));
    });

  const toggleWeeklyOff = (day: string) => {
    setForm((prev) => ({
      ...prev,
      weeklyOffPolicy: {
        ...prev.weeklyOffPolicy,
        fixedDays: prev.weeklyOffPolicy.fixedDays.includes(day)
          ? prev.weeklyOffPolicy.fixedDays.filter((item) => item !== day)
          : [...prev.weeklyOffPolicy.fixedDays, day],
      },
    }));
  };

  const addMonthlyOffPattern = () => {
    setForm((prev) => ({
      ...prev,
      weeklyOffPolicy: {
        ...prev.weeklyOffPolicy,
        monthlyPatterns: [
          ...prev.weeklyOffPolicy.monthlyPatterns,
          { week: 'first', day: 'Saturday' },
        ],
      },
    }));
  };

  const updateMonthlyOffPattern = (
    index: number,
    key: 'week' | 'day',
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      weeklyOffPolicy: {
        ...prev.weeklyOffPolicy,
        monthlyPatterns: prev.weeklyOffPolicy.monthlyPatterns.map(
          (pattern, patternIndex) =>
            patternIndex === index ? { ...pattern, [key]: value } : pattern
        ),
      },
    }));
  };

  const removeMonthlyOffPattern = (index: number) => {
    setForm((prev) => ({
      ...prev,
      weeklyOffPolicy: {
        ...prev.weeklyOffPolicy,
        monthlyPatterns: prev.weeklyOffPolicy.monthlyPatterns.filter(
          (_, patternIndex) => patternIndex !== index
        ),
      },
    }));
  };

  const addHoliday = () => {
    setForm((prev) => ({
      ...prev,
      holidays: [...prev.holidays, { name: '', date: '' }],
    }));
  };

  const updateHoliday = (
    index: number,
    key: keyof HrHoliday,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      holidays: prev.holidays.map((holiday, holidayIndex) =>
        holidayIndex === index ? { ...holiday, [key]: value } : holiday
      ),
    }));
  };

  const removeHoliday = (index: number) => {
    const item = form.holidays[index];
    if (!item) return;
    moveSavedSetting(item._id, 'holiday', () =>
      setForm((prev) => ({
        ...prev,
        holidays: prev.holidays.filter((row) =>
          item._id ? row._id !== item._id : row !== item
        ),
      }))
    );
  };

  const updateSalary = (key: keyof HrSalaryRules, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      salaryRules: { ...prev.salaryRules, [key]: value },
    }));
  };

  const addLeavePolicy = () => {
    setForm((prev) => ({
      ...prev,
      leavePolicies: [
        ...prev.leavePolicies,
        {
          name: '',
          casualLeaves: 0,
          sickLeaves: 0,
          paidLeaves: 0,
          applyToAllRoles: false,
          assignedRoleIds: [],
        },
      ],
    }));
  };

  const updateLeavePolicyField = (
    index: number,
    key: keyof (typeof form.leavePolicies)[number],
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      leavePolicies: prev.leavePolicies.map((policy, policyIndex) =>
        policyIndex === index
          ? {
              ...policy,
              [key]: value,
              ...(key === 'applyToAllRoles' && value === true
                ? { assignedRoleIds: [] }
                : {}),
            }
          : policy
      ),
    }));
  };

  const removeLeavePolicy = (index: number) => {
    const item = form.leavePolicies[index];
    if (!item) return;
    moveSavedSetting(item._id, 'leavePolicy', () =>
      setForm((prev) => ({
        ...prev,
        leavePolicies: prev.leavePolicies.filter((row) =>
          item._id ? row._id !== item._id : row !== item
        ),
      }))
    );
  };

  const handleSave = () => {
    if (deletingSetting || savingProgress !== null) return;
    void (async () => {
      try {
        setSavingProgress(0);

        if (activeKey === 'company' || activeKey === 'salary-rules') {
          await saveSettings({
            workingDaysPerMonth: form.salaryRules.workingDaysPerMonth,
            workingHoursPerDay: form.salaryRules.dailyWorkingHours,
            salaryCalculationType: form.salaryRules.salaryCalculationType,
            overtimeEnabled: true,
            overtimeRate: form.salaryRules.overtimeRatePerHour,
            latePenaltyPerMinute: form.salaryRules.latePenaltyPerMinute,
          });
          setSavingProgress(100);
          message.success({
            content: 'HR settings saved successfully',
            icon: <CheckCircleOutlined />,
            duration: 3,
          });
          setTimeout(() => setSavingProgress(null), 1000);
          return;
        }

        if (activeKey === 'shifts') {
          let completed = 0;
          const total = form.shifts.length;

          for (const shift of form.shifts) {
            const payload = {
              name: shift.name,
              startTime: shift.startTime,
              endTime: shift.endTime,
              breakTime: shift.breakTimeMinutes,
              graceTime: 0,
              isNightShift: false,
              isActive: true,
            };

            if (shift._id) {
              await updateShiftApi(shift._id, payload);
            } else {
              await createShift(payload);
            }
            completed++;
            setSavingProgress((completed / total) * 100);
          }

          await fetchAll();
          message.success(
            `${form.shifts.length} shift configurations saved successfully.`
          );
          setSavingProgress(null);
          return;
        }

        if (activeKey === 'weekly-offs') {
          const payload = {
            name: 'Default Weekly Off',
            days: form.weeklyOffPolicy.fixedDays,
            monthlyWeekOffs: form.weeklyOffPolicy.monthlyPatterns.map(
              (pattern) => ({
                day: pattern.day,
                weeks: [weekNumberMap[pattern.week]],
              })
            ),
            isActive: true,
          };

          if (form.weeklyOffPolicy._id) {
            await updateWeeklyOff(form.weeklyOffPolicy._id, payload);
          } else {
            await createWeeklyOff(payload);
          }

          await fetchAll();
          message.success('Weekly off settings saved successfully.');
          setSavingProgress(null);
          return;
        }

        if (activeKey === 'leave-policy') {
          let completed = 0;
          const total = form.leavePolicies.length || 1;

          for (const policy of form.leavePolicies) {
            const payload = {
              name: policy.name || 'Default Leave Policy',
              roleIds: policy.applyToAllRoles ? [] : policy.assignedRoleIds,
              casualLeave: policy.casualLeaves,
              sickLeave: policy.sickLeaves,
              paidLeave: policy.paidLeaves,
              monthlyLimit: 0,
              carryForward: false,
              maxCarryForward: 0,
              isActive: true,
            };

            if (policy._id) {
              await updateLeavePolicy(policy._id, payload);
            } else {
              await createLeavePolicy(payload);
            }
            completed++;
            setSavingProgress((completed / total) * 100);
          }

          await fetchAll();
          message.success('Leave policies saved successfully.');
          setSavingProgress(null);
          return;
        }

        if (activeKey === 'holidays') {
          let completed = 0;
          const total = form.holidays.length || 1;

          for (const holiday of form.holidays) {
            const payload = {
              name: holiday.name || 'Company Holiday',
              date: holiday.date,
              isActive: true,
            };

            if (holiday._id) {
              await updateHolidayApi(holiday._id, payload);
            } else {
              await createHoliday(payload);
            }

            completed++;
            setSavingProgress((completed / total) * 100);
          }

          await fetchAll();
          message.success('Holiday calendar saved successfully.');
          setSavingProgress(null);
          return;
        }
      } catch (error) {
        console.log(error);
        message.error({
          content: 'Unable to save settings. Please try again.',
          duration: 4,
        });
        setSavingProgress(null);
      }
    })();
  };

  const contextValue: HrSettingsContextValue = {
    form,
    setCompanyName,
    addShift,
    updateShift,
    removeShift,
    removeWeeklyOffPolicy,
    canDeleteSettings: canDelete('settings'),
    deletingSetting,
    toggleWeeklyOff,
    addMonthlyOffPattern,
    updateMonthlyOffPattern,
    removeMonthlyOffPattern,
    addHoliday,
    updateHoliday,
    removeHoliday,
    updateSalary,
    addLeavePolicy,
    updateLeavePolicyField,
    removeLeavePolicy,
    handleSave,
  };

  const tabContentByKey: Record<string, JSX.Element> = {
    company: <CompanySettingsTab />,
    shifts: <ShiftsSettingsTab />,
    'weekly-offs': <WeeklyOffSettingsTab />,
    holidays: <HolidaysSettingsTab />,
    'salary-rules': <SalaryRulesSettingsTab />,
    'leave-policy': <LeavePolicySettingsTab />,
  };

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const firstWeeklyOff = weeklyOffs[0];

    setForm((prev) => ({
      ...prev,
      shifts:
        shifts.length > 0
          ? shifts.map((shift) => ({
              _id: shift._id,
              name: shift.name,
              startTime: shift.startTime,
              endTime: shift.endTime,
              breakTimeMinutes: shift.breakTime ?? 0,
            }))
          : prev.shifts,
      weeklyOffPolicy: firstWeeklyOff
        ? {
            _id: firstWeeklyOff._id,
            fixedDays: firstWeeklyOff.days ?? [],
            monthlyPatterns: (firstWeeklyOff.monthlyWeekOffs ?? []).flatMap(
              (item) =>
                (item.weeks ?? []).map((week) => ({
                  day: item.day,
                  week: weekLabelMap[week] ?? 'first',
                }))
            ),
          }
        : prev.weeklyOffPolicy,
      holidays: holidays.map((holiday) => ({
        _id: holiday._id,
        name: holiday.name,
        date: holiday.date?.slice(0, 10) ?? '',
      })),
      salaryRules: {
        workingDaysPerMonth:
          hrSettings?.workingDaysPerMonth ??
          prev.salaryRules.workingDaysPerMonth,
        dailyWorkingHours:
          hrSettings?.workingHoursPerDay ?? prev.salaryRules.dailyWorkingHours,
        overtimeRatePerHour:
          hrSettings?.overtimeRate ?? prev.salaryRules.overtimeRatePerHour,
        latePenaltyPerMinute:
          hrSettings?.latePenaltyPerMinute ??
          prev.salaryRules.latePenaltyPerMinute,
        salaryCalculationType:
          hrSettings?.salaryCalculationType ??
          prev.salaryRules.salaryCalculationType,
      },
      leavePolicies: leavePolicies.map((policy) => ({
        _id: policy._id,
        name: policy.name || 'Leave Policy',
        casualLeaves: policy.casualLeave ?? 0,
        sickLeaves: policy.sickLeave ?? 0,
        paidLeaves: policy.paidLeave ?? 0,
        applyToAllRoles: !policy.roleIds || policy.roleIds.length === 0,
        assignedRoleIds: (policy.roleIds ?? []).map((role) =>
          typeof role === 'string' ? role : role._id
        ),
      })),
    }));
  }, [hrSettings, shifts, weeklyOffs, holidays, leavePolicies]);

  return (
    <HrSettingsContext.Provider value={contextValue}>
      <Flex
        vertical
        gap={24}
        style={{
          padding: 0,
          background: token.colorBgLayout,
          minHeight: 'auto',
        }}
      >
        {/* Main Settings Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
            <Flex vertical gap={8}>
              <Space>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${activeSection.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: activeSection.color,
                  }}
                >
                  {activeSection.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {activeSection.title}
                  </Title>
                  <Text type="secondary">{activeSection.description}</Text>
                </div>
              </Space>
            </Flex>

            <Space size={12}>
              {savingProgress !== null && savingProgress < 100 && (
                <div style={{ width: 200 }}>
                  <Progress percent={savingProgress} size="small" />
                </div>
              )}
              <Tooltip title="Save all changes in current section">
                {canUpdate('settings') && (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={loading || savingProgress !== null}
                    disabled={deletingSetting}
                    size="large"
                    style={{
                      minWidth: 156,
                      borderRadius: 12,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {savingProgress === 100 ? 'Saved!' : 'Save Settings'}
                  </Button>
                )}
              </Tooltip>
            </Space>
          </Flex>

          <Divider style={{ margin: '24px 0' }} />

          <Segmented
            options={(HR_SETTINGS_TABS ?? []).map((tab) => ({
              label: (
                <Space>
                  {tabMeta[tab.key]?.icon}
                  <span>{tab.label}</span>
                </Space>
              ),
              value: tab.key,
            }))}
            value={activeKey}
            onChange={(value) => setActiveKey(value as string)}
            block
            style={{ marginBottom: 32 }}
          />

          <div
            style={{
              background: token.colorBgLayout,
              borderRadius: 20,
              padding: 24,
              minHeight: 400,
            }}
          >
            {tabContentByKey[activeKey] ?? <CompanySettingsTab />}
          </div>
        </Card>

        {/* Quick Tips Footer */}
        <Card
          size="small"
          style={{ borderRadius: 16, background: token.colorInfoBg }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space>
              <BulbOutlined style={{ color: token.colorInfo, fontSize: 20 }} />
              <Text strong>Pro tip:</Text>
              <Text type="secondary">
                Set up shifts before configuring weekly off patterns.
              </Text>
            </Space>
            <Button type="link" size="small">
              View documentation
            </Button>
          </Flex>
        </Card>
      </Flex>
    </HrSettingsContext.Provider>
  );
};

export default HrSettings;
