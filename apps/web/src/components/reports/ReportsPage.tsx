import {
  Activity,
  BarChart3,
  CalendarRange,
  Clock3,
  RefreshCw,
  TrendingUp,
  UserPlus,
  UserRoundMinus,
  Users,
  Wallet,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { getReports } from '../../services/api';
import type {
  ReportPreset,
  ReportsResponse,
} from '../../types/report';
import {
  daysBetweenDateKeys,
  formatDateOnly,
  toDateKey,
} from '../../utils/date';
import {
  REPORT_PRESETS,
  formatPaymentMethod,
  formatReportDate,
  formatReportMoney,
  reportDeltaClass,
  resolvePresetRange,
} from '../../utils/reports';
import { KpiCard } from '../dashboard/KpiCard';
import { LoadingState } from '../ui/LoadingState';

function ReportPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="report-panel">
      <header className="report-panel-head">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>

      {children}
    </section>
  );
}

function ProgressRow({
  label,
  value,
  max,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0;

  return (
    <div className="report-progress-row">
      <div className="report-progress-label">
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>

      <div
        className="report-progress-track"
        role="img"
        aria-label={`${label}: ${detail}`}
      >
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function ReportsPage() {
  const initialRange = resolvePresetRange('7d');

  const [preset, setPreset] = useState<ReportPreset>('7d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [applied, setApplied] = useState(initialRange);
  const [report, setReport] = useState<ReportsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(
    async (range: { from: string; to: string }) => {
      setLoading(true);
      setError('');

      try {
        const result = await getReports(range);

        setReport(result);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'No se pudo cargar el reporte.',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadReport(applied);
  }, [applied, loadReport]);

  const handlePresetChange = (value: ReportPreset) => {
    setPreset(value);

    if (value === 'custom') {
      return;
    }

    const range = resolvePresetRange(value);

    setFrom(range.from);
    setTo(range.to);
    setApplied(range);
  };

  const handleApply = () => {
    try {
      const validFrom = toDateKey(from);
      const validTo = toDateKey(to);

      if (daysBetweenDateKeys(validFrom, validTo) < 0) {
        setError(
          'La fecha de inicio no puede ser posterior a la fecha final.',
        );
        return;
      }

      setApplied({ from: validFrom, to: validTo });
    } catch {
      setError('Usa fechas con el formato YYYY-MM-DD.');
    }
  };

  const currency = report?.range.currency ?? 'PEN';

  const maxAttendance = report
    ? Math.max(...report.daily.map((day) => day.attendance), 1)
    : 1;
  const maxHour = report
    ? Math.max(...report.peakHours.map((hour) => hour.count), 1)
    : 1;
  const maxMethod = report
    ? Math.max(
        ...report.revenue.byMethod.map((method) => method.amount),
        1,
      )
    : 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Análisis</span>
          <h1>Reportes</h1>
          <p>
            Revisa asistencias, ingresos, retención y los horarios
            con mayor demanda del gimnasio.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => void loadReport(applied)}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? 'is-spinning' : undefined}
              aria-hidden="true"
            />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="report-filters">
        <div className="report-filter-presets">
          {[...REPORT_PRESETS, { value: 'custom' as const, label: 'Personalizado' }].map(
            (option) => (
              <button
                key={option.value}
                type="button"
                className={`report-preset ${
                  preset === option.value ? 'is-active' : ''
                }`}
                onClick={() => handlePresetChange(option.value)}
              >
                {option.label}
              </button>
            ),
          )}
        </div>

        <div className="report-date-range">
          <label>
            Desde
            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => {
                setFrom(event.target.value);
                setPreset('custom');
              }}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setTo(event.target.value);
                setPreset('custom');
              }}
            />
          </label>

          <button
            type="button"
            className="button secondary"
            onClick={handleApply}
            disabled={loading}
          >
            Aplicar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading && !report && (
        <LoadingState label="Calculando reporte..." />
      )}

      {report && (
        <>
          <div className="report-range-note">
            <CalendarRange size={14} aria-hidden="true" />
            {formatDateOnly(report.range.from)} —{' '}
            {formatDateOnly(report.range.to)} ·{' '}
            {report.range.days}{' '}
            {report.range.days === 1 ? 'día' : 'días'} · comparado
            con {formatDateOnly(report.range.previous.from)} —{' '}
            {formatDateOnly(report.range.previous.to)}
          </div>

          <div className="report-kpis">
            <KpiCard
              label="Asistencias"
              value={report.attendance.total}
              icon={Activity}
              tone="brand"
              delta={report.attendance.changePercent}
              footer={`${report.attendance.averagePerDay} por día`}
            />

            <KpiCard
              label="Socios nuevos"
              value={report.members.new}
              icon={UserPlus}
              tone="success"
              delta={report.members.changePercent}
              footer={`${report.members.deactivated} bajas en el periodo`}
            />

            <KpiCard
              label="Ingresos"
              value={formatReportMoney(
                report.revenue.total,
                currency,
              )}
              icon={Wallet}
              tone="info"
              delta={report.revenue.changePercent}
              footer={`${formatReportMoney(
                report.revenue.membership,
                currency,
              )} en membresías`}
            />

            <KpiCard
              label="Retención a 7 días"
              value={`${report.retention.rate7Days}%`}
              icon={TrendingUp}
              tone="warning"
              deltaLabel={`${report.retention.retained7Days} de ${report.retention.cohort} socios`}
              footer={`${report.retention.rate30Days}% a 30 días`}
            />
          </div>

          <div className="report-grid">
            <ReportPanel
              title="Asistencia diaria"
              description="Ingresos registrados por día del periodo."
            >
              <div
                className="report-bars"
                role="img"
                aria-label="Asistencias por día"
              >
                {report.daily.map((day) => (
                  <div
                    className="report-bar-column"
                    key={day.date}
                    title={`${formatDateOnly(day.date)}: ${day.attendance} asistencias, ${day.newMembers} altas, ${formatReportMoney(day.revenue, currency)}`}
                  >
                    <div className="report-bar-track">
                      <span
                        className="report-bar-fill"
                        style={{
                          height: `${(day.attendance / maxAttendance) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{day.attendance}</strong>
                    <span className="report-bar-label">
                      {formatReportDate(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            </ReportPanel>

            <div className="report-stack">
              <ReportPanel
                title="Horarios pico"
                description="Franjas con más check-ins según la hora local del gimnasio."
              >
                {report.peakHours.length === 0 ? (
                  <p className="report-empty">
                    Sin asistencias en el periodo.
                  </p>
                ) : (
                  <div className="report-progress-list">
                    {report.peakHours.map((hour) => (
                      <ProgressRow
                        key={hour.hour}
                        label={hour.hour ?? ''}
                        value={hour.count}
                        max={maxHour}
                        detail={`${hour.count} ingresos`}
                      />
                    ))}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Retención de nuevos socios"
                description={`Seguimiento de ${report.retention.cohort} socios durante ${report.retention.windowDays} días.`}
              >
                <div className="report-progress-list">
                  <ProgressRow
                    label="Primera semana"
                    value={report.retention.retained7Days}
                    max={Math.max(report.retention.cohort, 1)}
                    detail={`${report.retention.retained7Days}/${report.retention.cohort} · ${report.retention.rate7Days}%`}
                  />

                  <ProgressRow
                    label={`Hasta ${report.retention.windowDays} días`}
                    value={report.retention.retained30Days}
                    max={Math.max(report.retention.cohort, 1)}
                    detail={`${report.retention.retained30Days}/${report.retention.cohort} · ${report.retention.rate30Days}%`}
                  />
                </div>
              </ReportPanel>
            </div>

            <ReportPanel
              title="Ingresos por método de pago"
              description="Incluye pagos de membresía y de eventos."
            >
              {report.revenue.byMethod.length === 0 ? (
                <p className="report-empty">
                  Sin pagos completados en el periodo.
                </p>
              ) : (
                <div className="report-progress-list">
                  {report.revenue.byMethod.map((method) => (
                    <ProgressRow
                      key={method.method}
                      label={formatPaymentMethod(method.method)}
                      value={method.amount}
                      max={maxMethod}
                      detail={formatReportMoney(
                        method.amount,
                        currency,
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="report-revenue-split">
                <span>
                  <Wallet size={13} aria-hidden="true" />
                  Membresías:{' '}
                  {formatReportMoney(
                    report.revenue.membership,
                    currency,
                  )}
                </span>
                <span>
                  <CalendarRange size={13} aria-hidden="true" />
                  Eventos:{' '}
                  {formatReportMoney(
                    report.revenue.events,
                    currency,
                  )}
                </span>
              </div>
            </ReportPanel>

            <ReportPanel
              title="Movimiento de socios"
              description="Indicadores de la base actual y del periodo evaluado."
            >
              <div className="report-facts">
                <div>
                  <UserPlus size={16} aria-hidden="true" />
                  <span>Altas</span>
                  <strong>{report.members.new}</strong>
                </div>
                <div>
                  <UserRoundMinus size={16} aria-hidden="true" />
                  <span>Bajas</span>
                  <strong>{report.members.deactivated}</strong>
                </div>
                <div>
                  <Users size={16} aria-hidden="true" />
                  <span>Socios activos</span>
                  <strong>{report.members.active}</strong>
                </div>
                <div>
                  <BarChart3 size={16} aria-hidden="true" />
                  <span>Membresías activas</span>
                  <strong>{report.memberships.active}</strong>
                </div>
                <div>
                  <Clock3 size={16} aria-hidden="true" />
                  <span>Por vencer en 30 días</span>
                  <strong>
                    {report.memberships.expiringSoon}
                  </strong>
                </div>
                <div>
                  <TrendingUp size={16} aria-hidden="true" />
                  <span>Crecimiento neto</span>
                  <strong
                    className={reportDeltaClass(
                      report.members.netGrowth,
                    )}
                  >
                    {report.members.netGrowth > 0 ? '+' : ''}
                    {report.members.netGrowth}
                  </strong>
                </div>
              </div>
            </ReportPanel>
          </div>
        </>
      )}
    </div>
  );
}
