import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Camera, Bell, Shield, Globe, Save, RefreshCw, User, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'}>({show: false, message: '', type: 'success'});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [form, setForm] = useState({
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
  });
  const [initialForm, setInitialForm] = useState(form);

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Globe },
    { id: 'camera', label: 'Camera Defaults', icon: Camera },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'User & Access', icon: Shield },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (res.ok) {
          const parsedData = {
            ...data,
            night_mode: Boolean(data.night_mode),
            motion_detection: Boolean(data.motion_detection),
            email_alerts: Boolean(data.email_alerts),
            push_notifications: Boolean(data.push_notifications),
          };
          setForm(parsedData);
          setInitialForm(parsedData);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Gagal menyimpan settings', 'error');
        return;
      }
      const parsedData = {
        ...data,
        night_mode: Boolean(data.night_mode),
        motion_detection: Boolean(data.motion_detection),
        email_alerts: Boolean(data.email_alerts),
        push_notifications: Boolean(data.push_notifications),
      };
      setForm(parsedData);
      setInitialForm(parsedData);
      showToast('Settings berhasil disimpan', 'success');
    } catch {
      showToast('Gagal menyimpan settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">{label}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure global parameters and user access</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setForm(initialForm)}
            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tabs Sidebar */}
        <div className="flex overflow-x-auto lg:flex-col gap-2 pb-2 lg:pb-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-none' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 md:p-6 border-b border-gray-50 dark:border-slate-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            
            <div className="p-4 md:p-8 space-y-8">
              {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>}
              {activeTab === 'general' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">System Language</span>
                      <select
                        value={form.system_language}
                        onChange={(e) => setForm((prev) => ({ ...prev, system_language: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      >
                        <option>English (US)</option>
                        <option>Bahasa Indonesia</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Time Zone</span>
                      <select
                        value={form.time_zone}
                        onChange={(e) => setForm((prev) => ({ ...prev, time_zone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      >
                        <option>(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                        <option>(UTC+00:00) UTC</option>
                      </select>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Date Format</span>
                      <select
                        value={form.date_format}
                        onChange={(e) => setForm((prev) => ({ ...prev, date_format: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      >
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </label>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">System Version</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">v2.4.0-stable</span>
                      </div>
                      <button className="w-full py-2 bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw className="w-3 h-3" /> Check for Updates
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'camera' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Default Resolution</span>
                      <select
                        value={form.default_resolution}
                        onChange={(e) => setForm((prev) => ({ ...prev, default_resolution: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      >
                        <option>1080p (1920 x 1080)</option>
                        <option>720p (1280 x 720)</option>
                        <option>4K (3840 x 2160)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Frame Rate (FPS)</span>
                      <select
                        value={form.frame_rate}
                        onChange={(e) => setForm((prev) => ({ ...prev, frame_rate: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                      >
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                        <option>15 FPS</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl transition-colors">
                    <ToggleSwitch 
                      label="Night Mode" 
                      checked={form.night_mode} 
                      onChange={(val) => setForm(prev => ({ ...prev, night_mode: val }))} 
                    />
                    <ToggleSwitch 
                      label="Motion Detection" 
                      checked={form.motion_detection} 
                      onChange={(val) => setForm(prev => ({ ...prev, motion_detection: val }))} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'notification' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6 p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl transition-colors">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Delivery Methods</h3>
                      <ToggleSwitch 
                        label="Email Alerts" 
                        checked={form.email_alerts} 
                        onChange={(val) => setForm(prev => ({ ...prev, email_alerts: val }))} 
                      />
                      <ToggleSwitch 
                        label="Push Notifications" 
                        checked={form.push_notifications} 
                        onChange={(val) => setForm(prev => ({ ...prev, push_notifications: val }))} 
                      />
                    </div>
                    <div className="space-y-6 p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl transition-colors">
                      <label className="block">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Alert Sensitivity</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Determine how often alerts should be triggered based on system events.</p>
                        <select
                          value={form.alert_sensitivity}
                          onChange={(e) => setForm((prev) => ({ ...prev, alert_sensitivity: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> User Access Control
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">sys_admin_prime</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Administrator • Full Access</p>
                        </div>
                        <button 
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Network Settings
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1.5">Static IP Address</span>
                        <input
                          type="text"
                          value={form.static_ip}
                          onChange={(e) => setForm((prev) => ({ ...prev, static_ip: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1.5">Port</span>
                        <input
                          type="text"
                          value={form.port}
                          onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsPasswordModalOpen(false); showToast('Password updated successfully', 'success'); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Current Password</label>
                <input type="password" required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">New Password</label>
                <input type="password" required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Confirm New Password</label>
                <input type="password" required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100 dark:shadow-none">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
