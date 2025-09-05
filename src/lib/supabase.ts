import { createClient } from '@supabase/supabase-js';

// Database types
export interface Scene {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  data: {
    particles: any[];
    constraints: any[];
    composites: any[];
    environment: {
      gravity: { x: number; y: number; z: number };
      airDamping: number;
      groundBounce: number;
      groundFriction: number;
      timeScale: number;
    };
    camera?: {
      position: number[];
      target: number[];
    };
  };
  thumbnail?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'placeholder_url',
  supabaseAnonKey || 'placeholder_key'
);

// Scene operations
export const sceneOperations = {
  // Save a new scene
  async saveScene(scene: Omit<Scene, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        ...scene,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update existing scene
  async updateScene(sceneId: string, updates: Partial<Scene>) {
    const { data, error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', sceneId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Load user's scenes
  async loadUserScenes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Load a specific scene
  async loadScene(sceneId: string) {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a scene
  async deleteScene(sceneId: string) {
    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', sceneId);

    if (error) throw error;
  },

  // Load public scenes
  async loadPublicScenes() {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }
};