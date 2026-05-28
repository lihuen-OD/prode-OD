import { useEffect, useState } from 'react';
import { Plus, Pencil, Power, X, Check, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { PaymentStatusBadge, ActiveBadge } from '../../components/ui/StatusBadge';
import { usersService } from '../../services/usersService';
import { extractError, showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import type { User, PaymentStatus } from '../../types';

// ─── User Form Modal ──────────────────────────────────────────────────────────

interface UserFormData {
  fullName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  paymentStatus: PaymentStatus;
}



interface UserModalProps {
  user?: User;
  onClose: () => void;
  onSave: (data: UserFormData) => void | Promise<void>;
  fieldErrors?: Partial<Record<keyof UserFormData, string>>;
}

function UserModal({ user, onClose, onSave, fieldErrors }: UserModalProps) {
  const [form, setForm] = useState<UserFormData>({
    fullName: user?.fullName ?? '',
    username: user?.username ?? '',
    password: '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    paymentStatus: user?.paymentStatus ?? 'PENDING',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [showPass, setShowPass] = useState(false);
  // populate errors when server returns field-specific errors
  useEffect(() => {
    if (fieldErrors) {
      setErrors(fieldErrors as Partial<Record<keyof UserFormData, string>>);
    }
  }, [fieldErrors]);


  const field = (key: keyof UserFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      setErrors(prev => ({ ...prev, [key]: undefined }));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.fullName) nextErrors.fullName = 'Completá tu nombre para continuar.';
    if (!form.username) nextErrors.username = 'Completá tu usuario.';
    if (!user && form.password.length < 4) nextErrors.password = 'La contraseña debe tener al menos 4 caracteres.';
    // simple email regex
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Ingresá un email válido.';
    if (form.phone && !/^[0-9]{8,15}$/.test(form.phone)) nextErrors.phone = 'Ingresá un número de teléfono válido.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    void onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{user ? 'Editar usuario' : 'Crear usuario'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre completo *</label>
              <input
                {...field('fullName')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan Pérez"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Usuario *</label>
              <input
                {...field('username')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="juan.perez"
              />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contraseña {!user && '*'}
              </label>
              <div className="relative">
                <input
                  {...field('password')}
                  type={showPass ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={user ? 'Dejar vacío para no cambiar' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
              <input
                {...field('phone')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="11xxxxxxxx"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                {...field('email')}
                type="email"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="juan@email.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado de pago</label>
              <select
                {...field('paymentStatus')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagó</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {user ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modal, setModal] = useState<{ open: boolean; user?: User; fieldErrors?: Partial<Record<keyof UserFormData, string>> }>({ open: false });

  const refresh = async () => setUsers(await usersService.getParticipants());

  useEffect(() => {
    void refresh();
  }, []);

  const handleSave = async (data: UserFormData) => {
    try {
      if (modal.user) {
        await usersService.update(modal.user.id, {
          fullName: data.fullName,
          username: data.username,
          email: data.email || undefined,
          phone: data.phone || undefined,
          paymentStatus: data.paymentStatus,
        });
        showSuccessToast('Usuario actualizado correctamente.');
      } else {
        await usersService.create({
          fullName: data.fullName,
          username: data.username,
          password: data.password,
          email: data.email || undefined,
          phone: data.phone || undefined,
          paymentStatus: data.paymentStatus,
          role: 'USER',
          isActive: true,
        });
        showSuccessToast('Participación registrada correctamente.');
      }
      void refresh();
      setModal({ open: false });
    } catch (err: unknown) {
      const parsed = extractError(err);
      if (parsed.fields) {
        setModal({ ...modal, fieldErrors: parsed.fields as Partial<Record<keyof UserFormData, string>> });
      } else {
        showErrorToast(err);
      }
    }
  };

  const handleToggle = async (user: User) => {
    try {
      await usersService.toggleActive(user.id);
      void refresh();
      showSuccessToast(user.isActive ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.');
    } catch (err) {
      showErrorToast(err);
    }
  };

  return (
    <AppLayout variant="admin">
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} participantes registrados`}
        action={
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No hay participantes"
            description="Creá el primer usuario para comenzar."
            action={
              <button
                onClick={() => setModal({ open: true })}
                className="bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-800 transition-colors"
              >
                Crear usuario
              </button>
            }
          />
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contacto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Pago</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                          <p className="text-xs text-slate-400 sm:hidden">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-slate-600 font-mono">@{user.username}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-slate-500">{user.phone || '—'}</p>
                      <p className="text-xs text-slate-400">{user.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <PaymentStatusBadge status={user.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ActiveBadge isActive={user.isActive} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ open: true, user })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isActive
                              ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                              : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                          }`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {users.map(user => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <PaymentStatusBadge status={user.paymentStatus} />
                      <ActiveBadge isActive={user.isActive} />
                    </div>

                    <div className="mt-3 text-xs text-slate-500 space-y-1">
                      <p>{user.phone || '—'}</p>
                      <p className="truncate">{user.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setModal({ open: true, user })}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(user)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isActive
                          ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                          : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                      }`}
                      title={user.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {modal.open && (
        <UserModal
          user={modal.user}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          fieldErrors={modal.fieldErrors}
        />
      )}
    </AppLayout>
  );
}
