import { useState } from 'react';
import { Settings as SettingsIcon, Camera, Bell, Shield, Globe, Save, RefreshCw, User, Lock } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Globe },
    { id: 'camera', label: 'Camera Defaults', icon: Camera },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'User & Access', icon: Shield },
  ];

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500">Configure global parameters and user access</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
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
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-emerald-500" />
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            
            <div className="p-4 md:p-8 space-y-8">
              {activeTab === 'general' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 block mb-2">System Language</span>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>English (US)</option>
                        <option>Bahasa Indonesia</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 block mb-2">Time Zone</span>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                        <option>(UTC+00:00) UTC</option>
                      </select>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 block mb-2">Date Format</span>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </label>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-700 uppercase">System Version</span>
                        <span className="text-xs font-bold text-emerald-600">v2.4.0-stable</span>
                      </div>
                      <button className="w-full py-2 bg-white text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
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
                      <span className="text-sm font-bold text-gray-700 block mb-2">Default Resolution</span>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>1080p (1920 x 1080)</option>
                        <option>720p (1280 x 720)</option>
                        <option>4K (3840 x 2160)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-gray-700 block mb-2">Frame Rate (FPS)</span>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                        <option>15 FPS</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-8 p-4 bg-gray-50 rounded-2xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">Night Mode</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">Motion Detection</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" /> User Access Control
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                        <div>
                          <p className="text-sm font-bold text-gray-900">sys_admin_prime</p>
                          <p className="text-xs text-gray-500">Administrator • Full Access</p>
                        </div>
                        <button className="text-xs font-bold text-emerald-600 hover:underline">Change Password</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" /> Network Settings
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Static IP Address</span>
                        <input type="text" defaultValue="192.168.1.100" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Port</span>
                        <input type="text" defaultValue="8080" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
