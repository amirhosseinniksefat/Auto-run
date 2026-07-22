import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  RefreshCw, 
  Crown, 
  Sparkles, 
  X,
  AlertTriangle,
  Calendar,
  Lock,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { User } from '../types';
import { fetchAdminUsers, updateAdminUserSubscription, createAdminUser, deleteAdminUser } from '../services/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  authToken: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Edit / Subscription Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'expired'>('active');
  const [editPlan, setEditPlan] = useState<'free' | 'pro' | 'vip'>('pro');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [selectedDays, setSelectedDays] = useState<number | null>(30); // 30 days default
  const [customDaysInput, setCustomDaysInput] = useState<string>('');
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newPlan, setNewPlan] = useState<'free' | 'pro' | 'vip'>('pro');
  const [newDays, setNewDays] = useState<number>(30);
  const [submittingAdd, setSubmittingAdd] = useState<boolean>(false);

  // Delete User Confirm
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers(authToken);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگیری لیست کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      loadUsers();
    }
  }, [isOpen, authToken]);

  if (!isOpen) return null;

  // Calculate statistics
  const totalUsers = users.length;
  const activeSubs = users.filter((u) => u.subscriptionStatus === 'active' || u.role === 'admin').length;
  const inactiveSubs = users.filter((u) => u.subscriptionStatus === 'inactive' || u.subscriptionStatus === 'expired').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      u.username.toLowerCase().includes(q) || 
      (u.fullName && u.fullName.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    const matchesStatus = statusFilter === 'all' || u.subscriptionStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || u.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate remaining days for user
  const getRemainingDaysText = (user: User) => {
    if (user.role === 'admin' || !user.subscriptionExpireAt) {
      return { text: 'نامحدود (دائمی)', color: 'text-emerald-400 font-bold', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' };
    }
    const expireTime = new Date(user.subscriptionExpireAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || user.subscriptionStatus === 'expired') {
      return { text: 'منقضی شده', color: 'text-amber-400 font-bold', badgeBg: 'bg-amber-500/10 border-amber-500/30' };
    }
    return { text: `${diffDays} روز باقی‌مانده`, color: 'text-blue-400 font-bold', badgeBg: 'bg-blue-500/10 border-blue-500/30' };
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditStatus(user.subscriptionStatus || 'active');
    setEditPlan((user.plan as any) || 'pro');
    setEditRole(user.role || 'user');
    setSelectedDays(30);
    setCustomDaysInput('');
  };

  // Quick toggle user status
  const handleToggleStatus = async (user: User) => {
    const newSt = user.subscriptionStatus === 'active' ? 'inactive' : 'active';
    try {
      setSuccessMsg(null);
      await updateAdminUserSubscription(authToken, user.id, {
        subscriptionStatus: newSt,
      });
      setSuccessMsg(`وضعیت کاربر ${user.username} به ${newSt === 'active' ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت کاربر');
    }
  };

  // Submit Edit Subscription
  const handleSaveSubscription = async () => {
    if (!editingUser) return;
    setSubmittingEdit(true);
    try {
      let daysToApply: number | null = selectedDays;
      if (selectedDays === -2) { // Custom
        const parsed = parseInt(customDaysInput.trim(), 10);
        if (isNaN(parsed) || parsed <= 0) {
          alert('لطفاً تعداد روز معتبر وارد کنید.');
          setSubmittingEdit(false);
          return;
        }
        daysToApply = parsed;
      }

      await updateAdminUserSubscription(authToken, editingUser.id, {
        subscriptionStatus: editStatus,
        plan: editPlan,
        role: editRole,
        durationDays: daysToApply,
      });

      setSuccessMsg(`اشتراک کاربر ${editingUser.username} با موفقیت بروزرسانی شد.`);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تغییرات');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      alert('نام کاربری و رمز عبور الزامی است.');
      return;
    }
    setSubmittingAdd(true);
    try {
      await createAdminUser(authToken, {
        username: newUsername,
        fullName: newFullName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        role: newRole,
        plan: newPlan,
        durationDays: newDays,
      });

      setSuccessMsg(`کاربر جدید (${newUsername}) با موفقیت ایجاد شد.`);
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد کاربر');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Confirm Delete User
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteAdminUser(authToken, userId);
      setSuccessMsg('کاربر با موفقیت حذف شد.');
      setDeletingUserId(null);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کاربر');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] admin-modal-card">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                پنل مدیریت کاربران و اشتراک‌ها
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-normal">
                  مخصوص ادمین
                </span>
              </h2>
              <p className="text-xs text-slate-400">رصد کامل حساب‌های کاربری، کنترل دسترسی و تمدید اشتراک‌ها</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 border border-slate-700"
              title="بروزرسانی لیست"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">کل کاربران</span>
                <span className="text-lg font-black text-white">{totalUsers}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">اشتراک‌های فعال</span>
                <span className="text-lg font-black text-emerald-400">{activeSubs}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">غیرفعال / منقضی</span>
                <span className="text-lg font-black text-amber-400">{inactiveSubs}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">مدیران سیستم</span>
                <span className="text-lg font-black text-purple-300">{adminCount}</span>
              </div>
            </div>
          </div>

          {/* Search, Filters, Add User Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در نام، نام کاربری، ایمیل یا شماره..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">اشتراک فعال</option>
                <option value="inactive">اشتراک غیرفعال</option>
                <option value="expired">منقضی شده</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
              >
                <option value="all">همه پلن‌ها</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
                <option value="free">رایگان</option>
              </select>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>افزودن کاربر</span>
              </button>
            </div>
          </div>

          {/* User Table / List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>در حال دریافت لیست کاربران...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-800/20 rounded-2xl border border-dashed border-slate-800">
              کاربری با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">مشخصات کاربر</th>
                    <th className="p-3.5">نقش</th>
                    <th className="p-3.5">پلن</th>
                    <th className="p-3.5">وضعیت اشتراک</th>
                    <th className="p-3.5">اعتبار باقی‌مانده</th>
                    <th className="p-3.5">تاریخ ثبت‌نام</th>
                    <th className="p-3.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((user) => {
                    const rem = getRemainingDaysText(user);
                    const isUserActive = user.subscriptionStatus === 'active' || user.role === 'admin';

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* User Details */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
                              {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {user.fullName || user.username}
                                {user.role === 'admin' && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400 inline" title="ادمین ارشد" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 dir-ltr text-right font-mono">
                                @{user.username} {user.email ? `• ${user.email}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3.5">
                          {user.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[11px] inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-purple-400" />
                              ادمین
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
                              کاربر معمولی
                            </span>
                          )}
                        </td>

                        {/* Plan */}
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            user.plan === 'vip' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : user.plan === 'pro'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {user.plan === 'vip' ? 'VIP' : user.plan === 'pro' ? 'Pro' : 'رایگان'}
                          </span>
                        </td>

                        {/* Subscription Status Badge */}
                        <td className="p-3.5">
                          {user.role === 'admin' || user.subscriptionStatus === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              فعال
                            </span>
                          ) : user.subscriptionStatus === 'expired' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-amber-400" />
                              منقضی شده
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-medium">
                              <XCircle className="w-3 h-3 text-red-400" />
                              غیرفعال
                            </span>
                          )}
                        </td>

                        {/* Expiry Days */}
                        <td className="p-3.5">
                          <div className={`px-2.5 py-1 rounded-xl border text-[11px] inline-block ${rem.badgeBg} ${rem.color}`}>
                            {rem.text}
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="p-3.5 text-slate-400 text-[11px] dir-ltr text-right font-mono">
                          {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Quick Status Switch */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={user.role === 'admin'}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                isUserActive
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              } ${user.role === 'admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
                              title={isUserActive ? 'غیرفعال‌سازی سریع' : 'فعال‌سازی سریع'}
                            >
                              {isUserActive ? 'غیرفعال کن' : 'فعال کن'}
                            </button>

                            {/* Edit / Subscription Modal Trigger */}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-all"
                              title="مدیریت تمدید و ویرایش"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User */}
                            {user.email.toLowerCase() !== 'amir.r.an37@gmail.com' && (
                              <button
                                onClick={() => setDeletingUserId(user.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-slate-700 transition-all"
                                title="حذف کاربر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Edit Subscription & User Settings */}
        {editingUser && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-fade-in dir-rtl admin-modal-subdialog">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  مدیریت اشتراک و دسترسی @{editingUser.username}
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Status Picker */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">وضعیت اشتراک:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('active')}
                    className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                      editStatus === 'active' 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    فعال
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('inactive')}
                    className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                      editStatus === 'inactive' 
                        ? 'bg-red-500/20 border-red-500 text-red-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    غیرفعال
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('expired')}
                    className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                      editStatus === 'expired' 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    منقضی شده
                  </button>
                </div>
              </div>

              {/* Subscription Duration Quick Select */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">تمدید اعتبار اشتراک (افزایش زمان):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '۳۰ روزه (۱ ماه)', days: 30 },
                    { label: '۹۰ روزه (۳ ماه)', days: 90 },
                    { label: '۳۶۵ روزه (۱ سال)', days: 365 },
                    { label: '۷ روزه آزمایشی', days: 7 },
                    { label: 'دائمی (نامحدود)', days: -1 },
                    { label: 'تعداد روز سفارشی', days: -2 },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setSelectedDays(opt.days)}
                      className={`py-2 px-1 text-[11px] rounded-xl border font-bold transition-all ${
                        selectedDays === opt.days
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {selectedDays === -2 && (
                  <div className="mt-2.5">
                    <input
                      type="number"
                      placeholder="تعداد روز را وارد کنید (مثلا: ۴۵)..."
                      value={customDaysInput}
                      onChange={(e) => setCustomDaysInput(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/50 p-2 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Plan Selection */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">نوع پلن اشتراک:</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="pro">Pro (حرفه‌ای)</option>
                  <option value="vip">VIP (ویژه دائم)</option>
                  <option value="free">Free (رایگان محدود)</option>
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">سطح دسترسی (نقش):</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="user">کاربر معمولی (User)</option>
                  <option value="admin">مدیر سیستم (Admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleSaveSubscription}
                  disabled={submittingEdit}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
                >
                  {submittingEdit ? 'در حال ذخیره...' : 'اعمال و ذخیره اشتراک'}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add User */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-2xl animate-fade-in dir-rtl admin-modal-subdialog">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  تعریف و ایجاد کاربر جدید
                </h3>
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">نام کاربری (الزامی):</label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: user123"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">نام کامل / عنوان:</label>
                <input
                  type="text"
                  placeholder="مثلا: علی رضایی"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">ایمیل:</label>
                  <input
                    type="email"
                    placeholder="user@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">شماره همراه:</label>
                  <input
                    type="text"
                    placeholder="09120000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">رمز عبور (الزامی):</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">نقش کاربر:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="user">کاربر عادی</option>
                    <option value="admin">ادمین سیستم</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">مدت اولیه اشتراک:</label>
                  <select
                    value={newDays}
                    onChange={(e) => setNewDays(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value={30}>۳۰ روز (۱ ماه)</option>
                    <option value={90}>۹۰ روز (۳ ماه)</option>
                    <option value={365}>۱ سال</option>
                    <option value={-1}>دائمی / نامحدود</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
                >
                  {submittingAdd ? 'در حال ثبت...' : 'ساخت حساب کاربر'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Confirm Delete */}
        {deletingUserId && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-4 text-center animate-fade-in dir-rtl admin-modal-subdialog">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">تایید حذف کاربر</h3>
              <p className="text-xs text-slate-400">آیا از حذف این کاربر از سیستم اطمینان دارید؟ این عمل غیرقابل بازگشت است.</p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleDeleteUser(deletingUserId)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs transition-all"
                >
                  بله، حذف کن
                </button>
                <button
                  onClick={() => setDeletingUserId(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs transition-all"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
