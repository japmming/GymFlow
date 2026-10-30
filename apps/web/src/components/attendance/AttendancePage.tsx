import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { FormEvent } from 'react';

import {
  cancelAttendance,
  checkIn,
  getAttendances,
  restoreAttendance,
} from '../../services/api';

import type {
  Attendance,
  CheckInRequest,
} from '../../types/attendance';

import { formatDateOnly } from '../../utils/date';

import { QrScanner } from './QrScanner';

const EMPTY_FILTERS = {
  from: '',
  to: '',
  search: '',
};

export function AttendancePage() {
  const [attendances, setAttendances] = useState<
    Attendance[]
  >([]);

  const [lastAttendance, setLastAttendance] =
    useState<Attendance | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState('');
  const [historyError, setHistoryError] =
    useState('');
  const [memberCode, setMemberCode] = useState('');

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [appliedFilters, setAppliedFilters] =
    useState({
      ...EMPTY_FILTERS,
    });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] =
    useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] =
    useState(0);
  const [actionId, setActionId] =
    useState<string | null>(null);

  const loadAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setHistoryError('');

      const result = await getAttendances({
        ...appliedFilters,
        page,
        limit: 20,
      });

      setAttendances(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      console.error(err);

      setHistoryError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo cargar el historial de asistencias.',
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadAttendances();
  }, [loadAttendances, refreshKey]);

  const registerAttendance = useCallback(
    async (
      payload: CheckInRequest,
    ): Promise<boolean> => {
      if (processing) {
        return false;
      }

      try {
        setProcessing(true);
        setError('');
        setLastAttendance(null);

        const result = await checkIn(payload);

        setLastAttendance(result);

        setRefreshKey(
          (current) => current + 1,
        );

        return true;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error && err.message
            ? err.message
            : 'No se pudo registrar la asistencia. Verifica los datos y que la membresía esté vigente.',
        );

        return false;
      } finally {
        setProcessing(false);
      }
    },
    [processing],
  );

  const handleScan = useCallback(
    (qrToken: string) => {
      void registerAttendance({ qrToken });
    },
    [registerAttendance],
  );

  async function handleManualCheckIn(
    event: FormEvent,
  ) {
    event.preventDefault();

    const normalized = memberCode.trim();

    if (!normalized) {
      setError('Ingresa un código de socio.');
      return;
    }

    const success = await registerAttendance({
      memberCode: normalized,
    });

    if (success) {
      setMemberCode('');
    }
  }

  async function handleCancelAttendance(
    attendance: Attendance,
  ) {
    const reason = window.prompt(
      `Motivo de la anulación de la asistencia de ${attendance.member.firstName} ${attendance.member.lastName}:`,
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      setActionId(attendance.id);
      setHistoryError('');

      await cancelAttendance(
        attendance.id,
        reason.trim(),
      );

      if (lastAttendance?.id === attendance.id) {
        setLastAttendance(null);
      }

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : 'No se pudo anular la asistencia.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleRestoreAttendance(
    attendance: Attendance,
  ) {
    try {
      setActionId(attendance.id);
      setHistoryError('');

      await restoreAttendance(attendance.id);

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : 'No se pudo restaurar la asistencia.',
      );
    } finally {
      setActionId(null);
    }
  }

  function handleFilterChange(
    field: 'from' | 'to' | 'search',
    value: string,
  ) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFilterSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      filters.from &&
      filters.to &&
      filters.from > filters.to
    ) {
      setHistoryError(
        'La fecha "desde" no puede ser mayor que la fecha "hasta".',
      );

      return;
    }

    setHistoryError('');
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClearFilters() {
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setPage(1);
    setHistoryError('');
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Asistencia</h1>

          <p>
            Registra el ingreso de los miembros
            mediante código QR o código de socio.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            void loadAttendances();
          }}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="attendance-layout">
        <section className="content-card qr-card">
          <div className="content-card-header">
            <h2>Escanear QR o ingresar código</h2>

            <p>
              Solicita al miembro mostrar su código
              QR o ingresa su código de socio.
            </p>
          </div>

          <QrScanner
            onScan={handleScan}
            onError={setError}
          />

          <form
            className="manual-checkin"
            onSubmit={handleManualCheckIn}
          >
            <label>
              Código de socio
              <input
                value={memberCode}
                onChange={(e) =>
                  setMemberCode(e.target.value)
                }
                maxLength={30}
                placeholder="Ej. C0001"
                autoComplete="off"
                disabled={processing}
              />
            </label>

            <button
              type="submit"
              className="button primary"
              disabled={
                processing || !memberCode.trim()
              }
            >
              Registrar
            </button>
          </form>

          {processing && (
            <div className="processing-message">
              Validando membresía...
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h2>Último ingreso</h2>
          </div>

          {lastAttendance ? (
            <AttendanceSuccess
              attendance={lastAttendance}
            />
          ) : (
            <div className="empty-state">
              Escanea un código QR o ingresa un
              código de socio para registrar una
              asistencia.
            </div>
          )}
        </section>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <h2>Historial de asistencias</h2>

          <p>
            Filtra por fecha o socio.
          </p>
        </div>

        <form
          className="attendance-filters"
          onSubmit={handleFilterSubmit}
        >
          <label>
            Desde
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                handleFilterChange(
                  'from',
                  e.target.value,
                )
              }
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                handleFilterChange(
                  'to',
                  e.target.value,
                )
              }
            />
          </label>

          <label>
            Socio
            <input
              type="search"
              placeholder="Nombre, DNI o código"
              value={filters.search}
              onChange={(e) =>
                handleFilterChange(
                  'search',
                  e.target.value,
                )
              }
            />
          </label>

          <div className="filter-actions">
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              Filtrar
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="attendance-total">
          {total}{' '}
          {total === 1
            ? 'asistencia'
            : 'asistencias'}
        </div>

        {historyError && (
          <div className="alert error">
            {historyError}
          </div>
        )}

        {loading ? (
          <p>Cargando asistencias...</p>
        ) : (
          <>
            <AttendanceTable
              attendances={attendances}
              onCancel={handleCancelAttendance}
              onRestore={handleRestoreAttendance}
              actionId={actionId}
            />

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="button secondary"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (current) => current - 1,
                    )
                  }
                >
                  Anterior
                </button>

                <span>
                  Página {page} de {totalPages}
                </span>

                <button
                  className="button secondary"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage(
                      (current) => current + 1,
                    )
                  }
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function AttendanceSuccess({
  attendance,
}: {
  attendance: Attendance;
}) {
  const paidAmount = Number(
    attendance.membership?.paidAmount ?? 0,
  );
  const balance = Number(
    attendance.membership?.balance ?? 0,
  );

  return (
    <div className="attendance-success">
      <div className="attendance-success-icon">
        ✓
      </div>

      <h3>
        {attendance.member.firstName}{' '}
        {attendance.member.lastName}
      </h3>

      {attendance.member.documentNumber && (
        <p>
          DNI: {attendance.member.documentNumber}
        </p>
      )}

      {attendance.membership && (
        <>
          <p>
            Plan:{' '}
            <strong>
              {attendance.membership.plan.name}
            </strong>
          </p>

          <p>
            Vigencia:{' '}
            <strong>
              {formatDateOnly(
                attendance.membership.startDate,
              )}
              {' → '}
              {formatDateOnly(
                attendance.membership.endDate,
              )}
            </strong>
          </p>

          <p>
            Pagado:{' '}
            <strong>
              S/ {paidAmount.toFixed(2)}
            </strong>
            {' · '}
            Saldo:{' '}
            <strong>
              S/ {balance.toFixed(2)}
            </strong>
          </p>

          {balance > 0 && (
            <p className="warning-message">
              El miembro tiene un saldo pendiente.
            </p>
          )}
        </>
      )}

      <p>
        Entrada:{' '}
        <strong>
          {formatTime(
            attendance.checkedInAt,
          )}
        </strong>
      </p>
    </div>
  );
}

function AttendanceTable({
  attendances,
  onCancel,
  onRestore,
  actionId,
}: {
  attendances: Attendance[];
  onCancel: (attendance: Attendance) => void;
  onRestore: (attendance: Attendance) => void;
  actionId: string | null;
}) {
  if (attendances.length === 0) {
    return (
      <div className="empty-state">
        No hay asistencias registradas.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Miembro</th>
            <th>Plan</th>
            <th>Origen</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {attendances.map((attendance) => (
            <tr key={attendance.id}>
              <td>
                {formatDate(
                  attendance.checkedInAt,
                )}
              </td>

              <td>
                {formatTime(
                  attendance.checkedInAt,
                )}
              </td>

              <td>
                {attendance.member.firstName}{' '}
                {attendance.member.lastName}

                {attendance.member.memberCode && (
                  <div>
                    <span className="member-code">
                      {attendance.member.memberCode}
                    </span>
                  </div>
                )}
              </td>

              <td>
                {attendance.membership?.plan.name ??
                  '—'}
              </td>

              <td>
                {formatSource(attendance.source)}
              </td>

              <td>
                <span
                  className={`status-badge ${
                    attendance.cancelled
                      ? 'status-cancelled'
                      : 'status-active'
                  }`}
                >
                  {attendance.cancelled
                    ? 'Anulada'
                    : 'Registrada'}
                </span>

                {attendance.cancellationReason && (
                  <div className="table-description">
                    {attendance.cancellationReason}
                  </div>
                )}
              </td>

              <td>
                <div className="table-actions">
                  {attendance.cancelled ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={() =>
                        onRestore(attendance)
                      }
                      disabled={
                        actionId === attendance.id
                      }
                    >
                      {actionId === attendance.id
                        ? 'Restaurando...'
                        : 'Restaurar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="table-action danger"
                      onClick={() =>
                        onCancel(attendance)
                      }
                      disabled={
                        actionId === attendance.id
                      }
                    >
                      {actionId === attendance.id
                        ? 'Anulando...'
                        : 'Anular'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    'es-PE',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    'es-PE',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );
}

function formatSource(source?: string | null) {
  if (!source) {
    return '—';
  }

  if (source === 'MEMBER_CODE') {
    return 'Código de socio';
  }

  return source;
}
