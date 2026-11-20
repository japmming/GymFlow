import {
  ArrowRight,
  Bell,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../theme/ThemeProvider';
import type { Page } from '../../types/navigation';
import { PAGE_LABELS } from '../../types/navigation';
import {
  daysBetweenDateKeys,
  formatDateOnly,
  todayDateKey,
} from '../../utils/date';
import { useDashboardData } from '../dashboard/DashboardDataProvider';

interface TopbarProps {
  page: Page;
  onOpenSidebar: () => void;
  onCreateMember: () => void;
  onSearchMember: (term: string) => void;
  onNavigate: (page: Page) => void;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function Topbar({
  page,
  onOpenSidebar,
  onCreateMember,
  onSearchMember,
  onNavigate,
}: TopbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data } = useDashboardData();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef =
    useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const members = data?.members ?? [];

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (term.length < 2) {
      return [];
    }

    return members
      .filter((member) => {
        const haystack = [
          member.firstName,
          member.lastName,
          member.documentNumber,
          member.phone,
          member.memberCode,
          member.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      })
      .slice(0, 6);
  }, [members, query]);

  const showResults =
    searchOpen && query.trim().length >= 2;

  const expiringMemberships =
    data?.summary.expiringMemberships ?? [];
  const expiringCount =
    data?.summary.memberships.expiringSoon ?? 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        return;
      }

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    );
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      );
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, []);

  const selectMember = (memberCode: string) => {
    onSearchMember(memberCode);
    setQuery('');
    setSearchOpen(false);
    searchInputRef.current?.blur();
  };

  const handleSearchSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const activeMember = results[activeIndex];

    if (activeMember) {
      selectMember(activeMember.memberCode);
      return;
    }

    const term = query.trim();

    if (term) {
      onSearchMember(term);
      setQuery('');
      setSearchOpen(false);
    }
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!showResults || results.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, results.length - 1),
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.max(current - 1, 0),
      );
    }
  };

  const today = todayDateKey();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button topbar-menu"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
        >
          <Menu size={19} aria-hidden="true" />
        </button>

        <div className="topbar-title">
          <span>
            {page === 'dashboard'
              ? 'Panel general'
              : 'GymFlow'}
          </span>
          <strong>{PAGE_LABELS[page]}</strong>
        </div>
      </div>

      <div className="topbar-search" ref={searchWrapRef}>
        <form
          className="topbar-search-field"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <Search
            size={17}
            className="topbar-search-icon"
            aria-hidden="true"
          />

          <input
            ref={searchInputRef}
            type="search"
            value={query}
            placeholder="Buscar socio por nombre, DNI o teléfono"
            aria-label="Buscar socio por nombre, DNI o teléfono"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls="global-search-results"
            aria-activedescendant={
              showResults && results[activeIndex]
                ? `global-search-option-${results[activeIndex].id}`
                : undefined
            }
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          {query ? (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : (
            <kbd aria-hidden="true">/</kbd>
          )}
        </form>

        {showResults && (
          <div
            className="search-results"
            id="global-search-results"
            role="listbox"
            aria-label="Resultados de socios"
          >
            {results.length === 0 ? (
              <div className="search-empty">
                <strong>Sin coincidencias</strong>
                <span>
                  Prueba con otro nombre, DNI o teléfono.
                </span>
              </div>
            ) : (
              results.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  id={`global-search-option-${member.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? 'search-result is-active'
                      : 'search-result'
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() =>
                    selectMember(member.memberCode)
                  }
                >
                  <span
                    className="search-result-avatar"
                    aria-hidden="true"
                  >
                    {getInitials(
                      member.firstName,
                      member.lastName,
                    )}
                  </span>

                  <span className="search-result-main">
                    <strong>
                      {member.firstName} {member.lastName}
                    </strong>
                    <span>
                      {member.memberCode}
                      {member.documentNumber
                        ? ` · DNI ${member.documentNumber}`
                        : ''}
                      {member.phone
                        ? ` · ${member.phone}`
                        : ''}
                    </span>
                  </span>

                  <span
                    className={`status-badge ${
                      member.status === 'ACTIVE'
                        ? 'status-active'
                        : 'status-inactive'
                    }`}
                  >
                    {member.status === 'ACTIVE'
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>
                </button>
              ))
            )}

            {query.trim() && (
              <div className="search-footer">
                <button
                  type="button"
                  className="search-footer-button"
                  onClick={() => {
                    onSearchMember(query.trim());
                    setQuery('');
                    setSearchOpen(false);
                  }}
                >
                  Ver todos los resultados
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="button primary topbar-primary"
          onClick={onCreateMember}
          aria-label="Registrar nuevo socio"
        >
          <Plus size={17} aria-hidden="true" />
          <span>Nuevo socio</span>
        </button>

        <div
          className="topbar-popover"
          ref={notificationsRef}
        >
          <button
            type="button"
            className="icon-button"
            aria-label={`Notificaciones: ${expiringCount} membresías por vencer`}
            aria-expanded={notificationsOpen}
            aria-controls="notifications-popover"
            onClick={() =>
              setNotificationsOpen((current) => !current)
            }
          >
            <Bell size={18} aria-hidden="true" />

            {expiringCount > 0 && (
              <span className="notification-count">
                {expiringCount > 9 ? '9+' : expiringCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="popover notifications-popover"
              id="notifications-popover"
              role="dialog"
              aria-label="Notificaciones"
            >
              <div className="popover-header">
                <div>
                  <strong>Notificaciones</strong>
                  <span>
                    Membresías que vencen pronto
                  </span>
                </div>

                <span className="popover-count">
                  {expiringCount}
                </span>
              </div>

              {expiringMemberships.length === 0 ? (
                <div className="popover-empty">
                  Todo en orden. No hay membresías por
                  vencer en los próximos 7 días.
                </div>
              ) : (
                <div className="notifications-list">
                  {expiringMemberships
                    .slice(0, 5)
                    .map((membership) => {
                      const days = daysBetweenDateKeys(
                        today,
                        membership.endDate,
                      );

                      return (
                        <button
                          key={membership.id}
                          type="button"
                          className="notification-item"
                          onClick={() => {
                            onNavigate('memberships');
                            setNotificationsOpen(false);
                          }}
                        >
                          <span
                            className="notification-avatar"
                            aria-hidden="true"
                          >
                            {getInitials(
                              membership.member.firstName,
                              membership.member.lastName,
                            )}
                          </span>

                          <span className="notification-text">
                            <strong>
                              {membership.member.firstName}{' '}
                              {membership.member.lastName}
                            </strong>
                            <span>
                              {membership.plan.name} · vence{' '}
                              {formatDateOnly(
                                membership.endDate,
                              )}
                            </span>
                          </span>

                          <span className="notification-days">
                            {days <= 0
                              ? 'Hoy'
                              : `${days}d`}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}

              <div className="popover-footer">
                <button
                  type="button"
                  className="popover-footer-button"
                  onClick={() => {
                    onNavigate('memberships');
                    setNotificationsOpen(false);
                  }}
                >
                  Gestionar membresías
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? 'Activar modo claro'
              : 'Activar modo oscuro'
          }
          title={
            theme === 'dark'
              ? 'Activar modo claro'
              : 'Activar modo oscuro'
          }
        >
          {theme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>

        {user && (
          <span className="topbar-user" aria-hidden="true">
            {getInitials(user.firstName, user.lastName)}
          </span>
        )}
      </div>
    </header>
  );
}
