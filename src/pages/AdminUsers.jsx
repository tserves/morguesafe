import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, UserPlus, X, Loader2, Check, Mail, Shield,
  ShieldCheck, User, Stethoscope, Fingerprint, ClipboardList, Search,
  Pencil, Trash2, AlertTriangle
} from 'lucide-react';

const ROLES = [
  {
    value: 'admin',
    label: 'Administrator',
    icon: ShieldCheck,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    description: 'Full system access — manage users, settings, all records',
  },
  {
    value: 'pathologist',
    label: 'Pathologist',
    icon: Stethoscope,
    color: 'text-purple-500',
    bg: 'bg-purple-50 border-purple-200',
    description: 'Examinations, autopsy reports, cause of death',
  },
  {
    value: 'intake_officer',
    label: 'Intake Officer',
    icon: ClipboardList,
    color: 'text-green-500',
    bg: 'bg-green-50 border-green-200',
    description: 'Body intake, personal effects, storage assignment',
  },
  {
    value: 'custody_officer',
    label: 'Custody Officer',
    icon: Shield,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    description: 'Chain of custody, scan/lookup, movement logs',
  },
  {
    value: 'forensic_technician',
    label: 'Forensic Technician',
    icon: Fingerprint,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    description: 'Assists examinations, collects samples, technical support',
  },
  {
    value: 'user',
    label: 'General Staff',
    icon: User,
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    description: 'Read-only access to general case information',
  },
];

const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

function RoleBadge({ role }) {
  const config = roleMap[role] || { label: role, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: User };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function InviteModal({ onClose, onInvited }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate a placeholder email from the username if the user types a name without @
  const resolvedEmail = email.includes('@') ? email.trim().toLowerCase() : '';
  const isEmailValid = resolvedEmail.length > 0 && resolvedEmail.includes('.');

  const handleInvite = async () => {
    if (!isEmailValid) return;
    setSending(true);
    setError('');
    try {
      await base44.users.inviteUser(resolvedEmail, role);
      setSent(true);
      onInvited();
      setTimeout(() => {
        setSent(false);
        setFullName('');
        setEmail('');
        setRole('user');
      }, 1800);
    } catch (e) {
      setError(e?.message || 'Failed to send invitation.');
    }
    setSending(false);
  };

  const selectedRole = roleMap[role];
  const RoleIcon = selectedRole?.icon || User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" /> Add Staff Member
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Full Name */}
          <div>
            <Label>Full Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="e.g. Dr. Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label>Email Address <span className="text-destructive">*</span></Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="staff@organisation.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              An invitation link will be sent to this address. The staff member will set their own password.
            </p>
          </div>

          {/* Role */}
          <div>
            <Label>Staff Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1.5">
                <div className="flex items-center gap-2">
                  <RoleIcon className={`w-4 h-4 ${selectedRole?.color}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${r.color}`} />
                        <span>{r.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="mt-1.5 text-xs text-muted-foreground">{selectedRole.description}</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleInvite} disabled={sending || !isEmailValid}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : sent ? (
              <Check className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {sent ? 'Invitation Sent!' : 'Send Invitation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role || 'user');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, { role });
    onSaved();
    onClose();
    setSaving(false);
  };

  const selectedRole = roleMap[role];
  const RoleIcon = selectedRole?.icon || User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" /> Edit Staff Member
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.full_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1.5">
                <div className="flex items-center gap-2">
                  <RoleIcon className={`w-4 h-4 ${selectedRole?.color}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${r.color}`} />
                        <span>{r.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="mt-1.5 text-xs text-muted-foreground">{selectedRole.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.User.delete(user.id);
    onDeleted();
    onClose();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Remove Staff Member
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to remove <span className="font-semibold text-foreground">{user.full_name || user.email}</span> from the system? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-destructive">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.full_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Remove User
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadUsers = async () => {
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = ROLES.map(r => ({
    ...r,
    count: users.filter(u => u.role === r.value).length,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} staff members`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4" /> Invite Staff
          </Button>
        }
      />

      {/* Role breakdown cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {roleCounts.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => setRoleFilter(roleFilter === r.value ? 'all' : r.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                roleFilter === r.value ? r.bg + ' shadow-sm' : 'bg-card border-border hover:bg-muted/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${r.color}`} />
              <span className="text-lg font-bold text-foreground">{r.count}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <Shield className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <SelectItem key={r.value} value={r.value}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${r.color}`} />
                    {r.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Joined</th>
                <th className="text-right px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{u.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTarget(u)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(u)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} users shown
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvited={loadUsers} />
      )}
      {editTarget && (
        <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={loadUsers} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={loadUsers} />
      )}
    </div>
  );
}