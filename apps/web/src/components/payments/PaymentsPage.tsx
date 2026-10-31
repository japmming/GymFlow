import { useEffect, useMemo, useState } from 'react';

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

import { PaymentForm } from './PaymentForm';
import { PaymentTable } from './PaymentTable';

export function PaymentsPage() {
  const { isAdmin } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<
    Membership[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePayment = async (
    data: CreatePaymentRequest,
  ) => {
    try {
      setSubmitting(true);
      setError('');

      await createPayment(data);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el pago.',
      );

      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReversePayment = async (
    payment: Payment,
  ) => {
    const reason = window.prompt(
      `Motivo del reverso del pago de S/ ${Number(
        payment.amount,
      ).toFixed(2)}:`,
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await reversePayment(payment.id, reason.trim());

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo reversar el pago.',
      );
    } finally {
      setSubmitting(false);
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
        <p>Cargando pagos...</p>
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
          className="secondary-button"
          onClick={loadData}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Buscar por socio, DNI, código, plan o referencia..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="members-count">
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
          onReverse={handleReversePayment}
          reversing={submitting}
        />
      </section>
    </div>
  );
}