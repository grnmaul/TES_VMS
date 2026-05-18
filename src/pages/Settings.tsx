import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Camera, Bell, Shield, Globe, Save, RefreshCw, User, Lock, X, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'}>({show: false, message: '', type: 'success'});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { token } = useAuth();
  
  const FACTORY_DEFAULTS = {
    system_language: 'Bahasa Indonesia',
    time_zone: '(UTC+07:00) Bangkok, Hanoi, Jakarta',
    date_format: 'DD/MM/YYYY',
    default_resolution: '1080p (1920 x 1080)',
    frame_rate: '30 FPS',
    night_mode: true,
    motion_detection: true,
    static_ip: '192.168.1.100',
    port: '8080',
    email_alerts: false,
    push_notifications: true,
    alert_sensitivity: 'Medium',
    storage_quota: '500GB',
    retention_days: 30,
    auto_purge: true,
    recording_mode: 'Motion Only',
  };

  const [form, setForm] = useState(FACTORY_DEFAULTS);
  
  const [initialForm, setInitialForm] = useState(form);

  const tabs = [
    { id: 'system', label: 'System & Display', icon: Globe, desc: 'Global localization & formats' },
    { id: 'storage', label: 'Storage & Purge', icon: HardDrive, desc: 'Data retention & quota' },
    { id: 'alerts', label: 'Notifications & Alerts', icon: Bell, desc: 'Push & email notifications' },
    { id: 'network', label: 'Access & Network', icon: Shield, desc: 'Network connectivity & IP' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        
        const serverData = data;
        const loadedForm = {
          ...serverData,
          night_mode: serverData.night_mode === 1,
          motion_detection: serverData.motion_detection === 1,
          email_alerts: serverData.email_alerts === 1,
          push_notifications: serverData.push_notifications === 1,
          auto_purge: serverData.auto_purge === 1,
        };
        
        setForm(loadedForm);
        setInitialForm(loadedForm);
      } catch (error) {
        showToast('Gagal memuat konfigurasi dari server', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Map react boolean state back to numeric 1 or 0 for backend (although the backend asBooleanNumber function also accepts boolean directly)
      const payload = {
        ...form,
        night_mode: form.night_mode,
        motion_detection: form.motion_detection,
        email_alerts: form.email_alerts,
        push_notifications: form.push_notifications,
        auto_purge: form.auto_purge,
      };
      
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      
      const data = await res.json();
      const serverData = data;
      const updatedForm = {
        ...serverData,
        night_mode: serverData.night_mode === 1,
        motion_detection: serverData.motion_detection === 1,
        email_alerts: serverData.email_alerts === 1,
        push_notifications: serverData.push_notifications === 1,
        auto_purge: serverData.auto_purge === 1,
      };
      
      setForm(updatedForm);
      setInitialForm(updatedForm);
      showToast('Konfigurasi sistem berhasil diperbarui', 'success');
    } catch (error) {
      showToast('Gagal menyimpan konfigurasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsPasswordModalOpen(false);
        showToast('Password successfully updated', 'success');
        setOldPassword('');
        setNewPassword('');
      } else {
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, sublabel }: { checked: boolean, onChange: (val: boolean) => void, label: string, sublabel?: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 group">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">{label}</span>
        {sublabel && <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{sublabel}</span>}
      </div>
      <div className="relative w-12 h-6 cursor-pointer" onClick={() => onChange(!checked)}>
        <div className={`absolute inset-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'} shadow-sm`}></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">System Settings</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Configure advanced parameters for the Kota Madiun VMS engine</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              setForm(FACTORY_DEFAULTS);
              showToast('Dikembalikan ke setelan pabrik. Klik Save untuk menyimpan.', 'success');
            }}
            className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 md:flex-none px-8 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Modern Tabs Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all border group ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/5' 
                  : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`p-3 rounded-2xl transition-colors ${
                activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 group-hover:text-emerald-500'
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-black uppercase tracking-wider ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : ''}`}>{tab.label}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-10 flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                   <div className="flex flex-col items-center gap-4">
                     <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Configuration...</p>
                   </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {activeTab === 'system' && (
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <label className="block">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Date Format</span>
                          <select value={form.date_format} onChange={e => setForm({...form, date_format: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all">
                            <option>DD/MM/YYYY</option>
                            <option>MM/DD/YYYY</option>
                            <option>YYYY/MM/DD</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Time Zone</span>
                          <select value={form.time_zone} onChange={e => setForm({...form, time_zone: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all">
                            <option>(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                            <option>(UTC+08:00) Kuala Lumpur, Singapore</option>
                            <option>(UTC+09:00) Tokyo, Seoul</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'storage' && (
                    <div className="space-y-8">
                       <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Storage Usage</span>
                            <span className="text-lg font-black tracking-tight">0GB / {form.storage_quota}</span>
                         </div>
                         <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
                         </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                          <label className="block">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Retention Period (Days)</span>
                            <input type="number" value={form.retention_days} onChange={e => setForm({...form, retention_days: parseInt(e.target.value) || 0})}
                              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all" />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Recording Mode</span>
                            <select value={form.recording_mode} onChange={e => setForm({...form, recording_mode: e.target.value})}
                              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all">
                              <option>Continuous</option>
                              <option>Motion Only</option>
                            </select>
                          </label>
                          <label className="block md:col-span-2">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Storage Quota</span>
                            <select value={form.storage_quota} onChange={e => setForm({...form, storage_quota: e.target.value})}
                              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all">
                              <option>500GB</option>
                              <option>1TB</option>
                              <option>2TB</option>
                              <option>5TB</option>
                            </select>
                          </label>
                       </div>
                       <ToggleSwitch label="Auto-Purge Old Data" sublabel="Delete recordings older than retention period" checked={form.auto_purge} onChange={v => setForm({...form, auto_purge: v})} />
                    </div>
                  )}

                  {activeTab === 'alerts' && (
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-4">
                        <ToggleSwitch label="Email Alerts" checked={form.email_alerts} onChange={v => setForm({...form, email_alerts: v})} />
                        <ToggleSwitch label="Push Notifications" checked={form.push_notifications} onChange={v => setForm({...form, push_notifications: v})} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'network' && (
                    <div className="space-y-8">
                       <div className="bg-gray-50/50 dark:bg-slate-800/30 p-8 rounded-3xl border border-gray-100 dark:border-slate-800">
                         <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                           <Lock className="w-4 h-4 text-emerald-500" /> Admin Credentials
                         </h3>
                         <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:border-emerald-500">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Super Administrator</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full System Access</p>
                              </div>
                           </div>
                           <button onClick={() => setIsPasswordModalOpen(true)} className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                             Change Password
                           </button>
                         </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                         <label className="block">
                           <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Server Static IP</span>
                           <input type="text" value={form.static_ip} onChange={e => setForm({...form, static_ip: e.target.value})}
                             className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-900 dark:text-white transition-all" />
                         </label>
                         <label className="block">
                           <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Server Port</span>
                           <input type="text" value={form.port} onChange={e => setForm({...form, port: e.target.value})}
                             className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-900 dark:text-white transition-all" />
                         </label>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Toast */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-right-4">
          <div className={`flex items-center gap-4 px-8 py-5 rounded-[28px] shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-emerald-50 dark:bg-slate-900 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-slate-900 border-red-500 text-red-700 dark:text-red-400'
          }`}>
            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <p className="text-sm font-black tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-all animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Security Access</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Old Password</label>
                <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={passwordLoading} className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">New Access Key</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={passwordLoading} className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" disabled={passwordLoading} className="w-full py-5 bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
                  {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
