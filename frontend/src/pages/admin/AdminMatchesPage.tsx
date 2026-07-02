import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Check, Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FlagIcon } from '../../components/ui/FlagIcon';
import { matchesService } from '../../services/matchesService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { formatTournamentDateTimeLabel } from '../../utils/timezone';
import type { Match, MatchPhase, MatchStatus } from '../../types';

interface MatchFormData {
  phase: MatchPhase;
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homePlaceholder: string;
  awayPlaceholder: string;
  date: string;
  time: string;
  status: MatchStatus;
  venue: string;
}

const phaseOrder: MatchPhase[] = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'];
const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const phaseLabels: Record<MatchPhase, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: '32avos de final',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Final',
};

function getPredictionState(match: Match) {
  if (match.status === 'FINISHED') return 'Finalizado';
  if (match.status === 'LOCKED') return 'Cerrado para predicciones';
  const deadline = new Date(match.predictionDeadline).getTime();
  if (deadline <= Date.now()) return 'Cerrado para predicciones';
  const diff = deadline - Date.now();
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 || minutes > 0 ? `Cierra en ${hours}h ${minutes}m` : 'Abierto';
}

function isRealTeam(match: Match, side: 'home' | 'away') {
  return side === 'home' ? Boolean(match.homeTeamId) : Boolean(match.awayTeamId);
}

function MatchModal({ match, onClose, onSave }: {
  match?: Match;
  onClose: () => void;
  onSave: (data: MatchFormData) => void | Promise<void>;
}) {
  const [form, setForm] = useState<MatchFormData>({
    phase: match?.phase ?? 'GROUP',
    group: match?.group ?? 'A',
    homeTeam: match?.homeTeamId ? match.homeTeam : '',
    awayTeam: match?.awayTeamId ? match.awayTeam : '',
    homeFlag: match?.homeFlag ?? '',
    awayFlag: match?.awayFlag ?? '',
    homePlaceholder: match?.homePlaceholder ?? '',
    awayPlaceholder: match?.awayPlaceholder ?? '',
    date: match?.date ?? '',
    time: match?.time ?? '15:00',
    status: match?.status ?? 'OPEN',
    venue: match?.venue ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MatchFormData, string>>>({});
  const isGroup = form.phase === 'GROUP';

  const field = (key: keyof MatchFormData) => ({
    value: form[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm(prev => {
        const next = { ...prev, [key]: value };
        if (key === 'phase') {
          if (value === 'GROUP') {
            next.group = prev.group || 'A';
            next.homePlaceholder = '';
            next.awayPlaceholder = '';
          } else {
            next.group = '';
          }
        }
        return next;
      });
      setErrors(prev => ({ ...prev, [key]: undefined }));
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof MatchFormData, string>> = {};
    if (!form.phase) nextErrors.phase = 'Selecciona una fase.';
    if (!form.status) nextErrors.status = 'Selecciona un estado.';
    if (!form.date) nextErrors.date = 'Completa la fecha.';
    if (!form.time) nextErrors.time = 'Completa la hora.';

    if (isGroup) {
      if (!form.group) nextErrors.group = 'Completa el grupo.';
      if (!form.homeTeam.trim()) nextErrors.homeTeam = 'Completa el equipo local.';
      if (!form.awayTeam.trim()) nextErrors.awayTeam = 'Completa el equipo visitante.';
    } else {
      if (!form.homeTeam.trim() && !form.homePlaceholder.trim()) nextErrors.homeTeam = 'Carga equipo real o placeholder local.';
      if (!form.awayTeam.trim() && !form.awayPlaceholder.trim()) nextErrors.awayTeam = 'Carga equipo real o placeholder visitante.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    void onSave({ ...form, group: isGroup ? form.group : '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800">{match ? 'Editar partido' : 'Nuevo partido'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fase *</label>
              <select {...field('phase')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {phaseOrder.map(phase => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}
              </select>
            </div>

            {isGroup && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Grupo *</label>
                <select {...field('group')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {groups.map(group => <option key={group} value={group}>Grupo {group}</option>)}
                </select>
                {errors.group && <p className="mt-1 text-xs text-red-500">{errors.group}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado *</label>
              <select {...field('status')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="OPEN">Abierto</option>
                <option value="LOCKED">Cerrado</option>
                <option value="FINISHED">Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{isGroup ? 'Equipo local *' : 'Equipo local real'}</label>
              <div className="flex gap-2">
                <div className="w-16 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <FlagIcon teamName={form.homeTeam} fallback={form.homeFlag} size="sm" />
                </div>
                <input {...field('homeTeam')} placeholder="Argentina" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {errors.homeTeam && <p className="mt-1 text-xs text-red-500">{errors.homeTeam}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{isGroup ? 'Equipo visitante *' : 'Equipo visitante real'}</label>
              <div className="flex gap-2">
                <div className="w-16 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <FlagIcon teamName={form.awayTeam} fallback={form.awayFlag} size="sm" />
                </div>
                <input {...field('awayTeam')} placeholder="Francia" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {errors.awayTeam && <p className="mt-1 text-xs text-red-500">{errors.awayTeam}</p>}
            </div>

            {!isGroup && (
              <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Configuracion de cruce eliminatorio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Placeholder local</label>
                    <input {...field('homePlaceholder')} placeholder="1ro Grupo A / Ganador Partido 73" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Placeholder visitante</label>
                    <input {...field('awayPlaceholder')} placeholder="2do Grupo B / Ganador Partido 74" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">La votacion se habilita cuando los dos equipos reales esten cargados.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha *</label>
              <input {...field('date')} type="date" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hora *</label>
              <input {...field('time')} type="time" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estadio</label>
              <input {...field('venue')} placeholder="MetLife Stadium" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {match ? 'Guardar cambios' : 'Crear partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteMatchModal({ match, loading = false, onClose, onConfirm }: {
  match: Match;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-3 px-6 pt-6">
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Eliminar partido</h2>
            <p className="text-sm text-slate-500">Accion irreversible</p>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-700 leading-6">Esta accion no se puede deshacer.</p>
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-900">{match.homeTeam} vs {match.awayTeam}</p>
            <p className="text-xs text-slate-500 mt-1">{phaseLabels[match.phase]} {match.group ? `- Grupo ${match.group}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" disabled={loading}>
            Cancelar
          </button>
          <button type="button" onClick={() => void onConfirm()} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
            <Trash2 className="w-4 h-4" />
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminMatchCard({ match, onEdit, onDelete }: {
  match: Match;
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
}) {
  const pendingDefinition = match.phase !== 'GROUP' && (!isRealTeam(match, 'home') || !isRealTeam(match, 'away'));

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {phaseLabels[match.phase]}
          </span>
          {match.phase === 'GROUP' && match.group && (
            <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">Grupo {match.group}</span>
          )}
          <StatusBadge type="match" value={match.status} />
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">{getPredictionState(match)}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {pendingDefinition && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Pendiente de definicion
          </div>
        )}

        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0 text-center">
            <div className="mb-1 flex justify-center">
              <FlagIcon teamName={match.homeTeam} fallback={match.homeFlag} size="sm" className="shrink-0" />
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-tight break-words">{match.homeTeam}</p>
            <p className="text-xs text-slate-400 mt-0.5">Local</p>
          </div>
          <div className="flex flex-col items-center px-2 shrink-0">
            <span className="text-xs font-bold text-slate-400 tracking-widest">VS</span>
          </div>
          <div className="flex-1 min-w-0 text-center">
            <div className="mb-1 flex justify-center">
              <FlagIcon teamName={match.awayTeam} fallback={match.awayFlag} size="sm" className="shrink-0" />
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-tight break-words">{match.awayTeam}</p>
            <p className="text-xs text-slate-400 mt-0.5">Visitante</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatTournamentDateTimeLabel(match.startTime)}</span>
          {match.venue && <span className="flex items-center gap-1 min-w-0 max-w-full truncate"><Clock className="w-3 h-3" />{match.venue}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onEdit(match)} className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
            <Pencil className="w-4 h-4 shrink-0" />
            Editar
          </button>
          <button onClick={() => onDelete(match)} className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4 shrink-0" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function groupMatches(matches: Match[]) {
  const sorted = [...matches].sort((a, b) => {
    const phaseDiff = phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
    if (phaseDiff !== 0) return phaseDiff;
    const groupDiff = (a.group ?? '').localeCompare(b.group ?? '', 'es', { numeric: true });
    if (groupDiff !== 0) return groupDiff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return phaseOrder
    .map(phase => ({
      phase,
      groups: phase === 'GROUP'
        ? groups.map(group => ({ title: `Grupo ${group}`, matches: sorted.filter(match => match.phase === phase && match.group === group) })).filter(group => group.matches.length > 0)
        : [{ title: phaseLabels[phase], matches: sorted.filter(match => match.phase === phase) }].filter(group => group.matches.length > 0),
    }))
    .filter(section => section.groups.length > 0);
}

export function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [modal, setModal] = useState<{ open: boolean; match?: Match }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; match?: Match }>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [filterPhase, setFilterPhase] = useState<MatchPhase | 'all'>('all');

  const filtered = filterPhase === 'all' ? matches : matches.filter(match => match.phase === filterPhase);
  const sections = useMemo(() => groupMatches(filtered), [filtered]);

  const refresh = async () => setMatches(await matchesService.getAll());

  useEffect(() => {
    void refresh();
  }, []);

  const handleSave = async (data: MatchFormData) => {
    try {
      if (modal.match) {
        const updated = await matchesService.update(modal.match.id, data);
        if (updated) setMatches(prev => prev.map(m => (m.id === updated.id ? updated : m)));
        showSuccessToast('Partido actualizado correctamente.');
      } else {
        const created = await matchesService.create(data);
        setMatches(prev => [...prev, created]);
        showSuccessToast('Partido creado correctamente.');
      }
      setModal({ open: false });
    } catch (err) {
      showErrorToast(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.match) return;
    setDeleting(true);
    try {
      const deletedId = deleteModal.match.id;
      await matchesService.delete(deletedId);
      showSuccessToast('Partido eliminado correctamente.');
      setDeleteModal({ open: false });
      setMatches(prev => prev.filter(m => m.id !== deletedId));
    } catch (err) {
      showErrorToast(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout variant="admin">
      <PageHeader
        title="Partidos"
        subtitle={`${matches.length} partidos cargados`}
        action={
          <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo partido
          </button>
        }
      />

      <div className="relative mb-5">
        <div className="flex w-full max-w-full min-w-0 flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-2 pr-4 whitespace-nowrap overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
          <button onClick={() => setFilterPhase('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterPhase === 'all' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
            Todos
          </button>
          {phaseOrder.map(phase => (
            <button key={phase} onClick={() => setFilterPhase(phase)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterPhase === phase ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
              {phaseLabels[phase]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {sections.map(section => (
          <section key={section.phase} className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">{phaseLabels[section.phase]}</h2>
            {section.groups.map(group => (
              <div key={group.title} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-700">{group.title}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">{group.matches.length} partido{group.matches.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {group.matches.map(match => (
                    <AdminMatchCard key={match.id} match={match} onEdit={item => setModal({ open: true, match: item })} onDelete={item => setDeleteModal({ open: true, match: item })} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      {modal.open && <MatchModal match={modal.match} onClose={() => setModal({ open: false })} onSave={handleSave} />}
      {deleteModal.open && deleteModal.match && <DeleteMatchModal match={deleteModal.match} loading={deleting} onClose={() => !deleting && setDeleteModal({ open: false })} onConfirm={handleDelete} />}
    </AppLayout>
  );
}
