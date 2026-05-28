import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  site_name?: string;
  site_email?: string;
  site_phone?: string;
  esewa_merchant_id?: string;
  esewa_secret_key?: string;
  // content blocks
  home_hero_title?: string;
  home_hero_subtitle?: string;
  footer_text?: string;
  dashboard_announcement?: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  refresh: () => Promise<void>;
  update: (payload: Partial<SiteSettings>) => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return ctx;
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({});

  const load = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', '11111111-1111-1111-1111-111111111111').maybeSingle();
      if (error) throw error;
      setSettings(data || {});
    } catch (err) {
      console.error('Failed to load site settings', err);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => { await load(); };

  const update = async (payload: Partial<SiteSettings>) => {
    try {
      const row = { id: '11111111-1111-1111-1111-111111111111', ...payload, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('site_settings').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('Failed to update site settings', err);
      throw err;
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, refresh, update }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export default SiteSettingsContext;
