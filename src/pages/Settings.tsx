import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Camera, Bell, Shield, Globe, Save, RefreshCw, User, Lock, X, CheckCircle2, AlertCircle, Brain, HardDrive, Database, Sliders, Activity } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'}>({show: false, message: '', type: 'success'});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    // System
    system_name: 'VMS Kota Madiun',
    system_language: 'Bahasa Indonesia',
    time_zone: '(UTC+07:00) Jakarta',
    auto_restart: true,
    
    // AI & Analytics
    ai_sensitivity: 'Medium',
    ai_model: 'YOLOv8-M (Balanced)',
    detect_vehicles: true,
    detect_persons: true,
    detect_parking_violation: false,
    
    // Storage
    storage_quota: '500GB',
    retention_days: 30,
    auto_purge: true,
    recording_mode: 'Motion Only',
    
    // Security
    static_ip: '192.168.1.100',
    port: '8080',
    session_timeout: '60 min',
    two_factor: false
  });
  
  const [initialForm, setInitialForm] = useState(form);

  const tabs = [
    { id: 'system', label: 'System Configuration', icon: Globe, desc: 'Global server & localization' },
    { id: 'ai', label: 'AI & Analytics', icon: Brain, desc: 'Object detection & sensitivity' },
    { id: 'storage', label: 'Storage & Purge', icon: HardDrive, desc: 'Data retention & quota' },
    { id: 'security', label: 'Access & Network', icon: Shield, desc: 'Security & connectivity' },
  ];

  useEffect(() => {
    // Simulated load
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const saveSettings = async () => {
    setSaving(true);
    // Simulated save
    setTimeout(() => {
      setInitialForm(form);
      showToast('Konfigurasi sistem berhasil diperbarui', 'success');
      setSaving(false);
    }, 800);
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
            onClick={() => setForm(initialForm)}
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
          
          <div className="mt-8 p-6 bg-slate-900 rounded-[32px] border border-slate-800 relative overflow-hidden hidden lg:block">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Engine Status</p>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">All AI models are running optimally. Last calibration: Today, 08:00 AM</p>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          </div>
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
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">System Identifier</span>
                          <input type="text" value={form.system_name} onChange={e => setForm({...form, system_name: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all" />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Language</span>
                          <select value={form.system_language} onChange={e => setForm({...form, system_language: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all">
                            <option>Bahasa Indonesia</option>
                            <option>English (US)</option>
                          </select>
                        </label>
                      </div>
                      
                      <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                           <Activity className="w-4 h-4 text-emerald-500" /> Maintenance Schedule
                        </h3>
                        <ToggleSwitch 
                          label="Auto-Restart Service" 
                          sublabel="Daily at 03:00 AM for optimization"
                          checked={form.auto_restart}
                          onChange={v => setForm({...form, auto_restart: v})}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'ai' && (
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <label className="block">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Confidence Threshold</span>
                          <select value={form.ai_sensitivity} onChange={e => setForm({...form, ai_sensitivity: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                            <option>Low (0.35)</option>
                            <option>Medium (0.50)</option>
                            <option>High (0.75)</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">AI Model Engine</span>
                          <select value={form.ai_model} onChange={e => setForm({...form, ai_model: e.target.value})}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                            <option>YOLOv8-N (Fastest)</option>
                            <option>YOLOv8-M (Balanced)</option>
                            <option>YOLOv8-X (Most Accurate)</option>
                          </select>
                        </label>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block px-1">Active Class Detection</span>
                        <div className="grid md:grid-cols-2 gap-4">
                          <ToggleSwitch label="Vehicle Detection" checked={form.detect_vehicles} onChange={v => setForm({...form, detect_vehicles: v})} />
                          <ToggleSwitch label="Person Detection" checked={form.detect_persons} onChange={v => setForm({...form, detect_persons: v})} />
                          <ToggleSwitch label="Parking Violation" checked={form.detect_parking_violation} onChange={v => setForm({...form, detect_parking_violation: v})} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'storage' && (
                    <div className="space-y-8">
                       <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Storage Usage</span>
                            <span className="text-lg font-black tracking-tight">342GB / 500GB</span>
                         </div>
                         <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }}></div>
                         </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                          <label className="block">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Retention Period (Days)</span>
                            <input type="number" value={form.retention_days} onChange={e => setForm({...form, retention_days: parseInt(e.target.value)})}
                              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Recording Mode</span>
                            <select value={form.recording_mode} onChange={e => setForm({...form, recording_mode: e.target.value})}
                              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                              <option>Continuous</option>
                              <option>Motion Only</option>
                              <option>AI Trigger Only</option>
                            </select>
                          </label>
                       </div>
                       <ToggleSwitch label="Auto-Purge Old Data" sublabel="Delete recordings older than retention period" checked={form.auto_purge} onChange={v => setForm({...form, auto_purge: v})} />
                    </div>
                  )}

                  {activeTab === 'security' && (
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
                           <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3 px-1">Session Timeout</span>
                           <select value={form.session_timeout} onChange={e => setForm({...form, session_timeout: e.target.value})}
                             className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                             <option>15 min</option>
                             <option>60 min</option>
                             <option>Never</option>
                           </select>
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
            <form onSubmit={(e) => { e.preventDefault(); setIsPasswordModalOpen(false); showToast('Admin access key updated', 'success'); }} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Old Password</label>
                <input type="password" required className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">New Access Key</label>
                  <input type="password" required className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
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
