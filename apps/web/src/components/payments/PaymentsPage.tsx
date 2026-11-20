import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import {
  createPayment,
  getMembers,
  getMemberships,
  getPayments,
  reversePayment,
} from '../../services/api';

import type { Member } from '../../types/member';
import type { Membership } from '../../types/membership';
import type {
  CreatePaymentRequest,
  Payment,
} from '../../types/payment';

import { matchesSearch } from '../../utils/search';

import { ActionDialog } from '../ui/ActionDialog';
import { LoadingState } from '../ui/LoadingState';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';
import { PaymentForm } from './PaymentForm';
import { PaymentTable } from './PaymentTable';

export function PaymentsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<
    Membership[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reversingId, setReversingId] = useState<
    string | null
  >(null);
  const [error, setError] = useState('');
  const [pendingReverse, setPendingReverse] =
    useState<Payment | null>(null);

  const loadData = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError('');

        const [
          paymentsData,
          membersData,
          membershipsData,
        ] = await Promise.all([
          getPayments(),
          getMembers(),
          getMemberships(),
        ]);

        setPayments(paymentsData);
        setMembers(membersData);
        setMemberships(membershipsData);
      } catch (err) {
        console.error(err);

        setError(
          'No se pudo cargar la información de pagos.',
        );
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadData('initial');
  }, [loadData]);

  const handleCreatePayment = async (
    data: CreatePaymentRequest,
  ) => {
    try {
      setSubmitting(true);

      await createPayment(data);

      await loadData('refresh');

      notify('Pago registrado correctamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReversePayment = async (
    payment: Payment,
    reason: string,
  ) => {
    try {
      setReversingId(payment.id);

      await reversePayment(payment.id, reason);

      await loadData('refresh');

      notify('Pago reversado correctamente.');
    } finally {
      setReversingId(null);
    }
  };

  const totalPayments = useMemo(() => {
    return payments
      .filter(
        (payment) => payment.status === 'COMPLETED',
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0,
      );
  }, [payments]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) =>
        matchesSearch(
          [
            payment.member.firstName,
            payment.member.lastName,
            payment.member.documentNumber,
            payment.member.memberCode,
            payment.membership.plan.name,
            payment.reference,
            payment.notes,
            String(payment.amount),
          ],
          search,
        ),
      ),
    [payments, search],
  );

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando pagos..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Pagos</h1>
          <p>
            Registra y consulta los pagos de las
            membresías.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() => {
            void loadData('refresh');
          }}
          disabled={refreshing}
        >
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <SearchField
          label="Buscar pagos"
          placeholder="Buscar por socio, DNI, código, plan o referencia..."
          value={search}
          onChange={setSearch}
        />

        <div className="members-count" aria-live="polite">
          {filteredPayments.length} de {payments.length}{' '}
          pagos
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>Total de pagos</span>
          <strong>{payments.length}</strong>
        </div>

        <div className="summary-card">
          <span>Ingresos netos</span>
          <strong>
            S/ {totalPayments.toFixed(2)}
          </strong>
        </div>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>Registrar pago</h2>
            <p>
              Asocia el pago a una membresía
              existente.
            </p>
          </div>
        </div>

        <PaymentForm
          members={members}
          memberships={memberships}
          onSubmit={handleCreatePayment}
          submitting={submitting}
        />
      </section>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>Historial de pagos</h2>
            <p>
              Últimos pagos registrados.
            </p>
          </div>
        </div>

        <PaymentTable
          payments={filteredPayments}
          canReverse={isAdmin}
          onReverse={setPendingReverse}
          reversingId={reversingId}
        />
      </section>

      {pendingReverse && (
        <ActionDialog
          title="Reversar pago"
          description={
            <>
              Se reversará el pago de{' '}
              <strong>
                S/{' '}
                {Number(
                  pendingReverse.amount,
                ).toFixed(2)}
              </strong>{' '}
              de{' '}
              {pendingReverse.member.firstName}{' '}
              {pendingReverse.member.lastName}. Indica el motivo
              para dejar registro.
            </>
          }
          confirmLabel="Reversar pago"
          cancelLabel="Volver"
          danger
          reason={{
            label: 'Motivo del reverso',
            placeholder:
              'Ej. El socio solicitó la devolución del pago',
            required: true,
            maxLength: 240,
          }}
          onConfirm={(reason) =>
            handleReversePayment(pendingReverse, reason)
          }
          onClose={() => setPendingReverse(null)}
        />
      )}
    </div>
  );
}