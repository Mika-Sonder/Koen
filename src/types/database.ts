export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id: string; username: string; avatar_url: string | null; bio: string | null; is_public: boolean; created_at: string; updated_at: string }; Insert: { id: string; username: string; avatar_url?: string | null; bio?: string | null; is_public?: boolean }; Update: { username?: string; avatar_url?: string | null; bio?: string | null; is_public?: boolean } };
      user_lists: { Row: { id: string; user_id: string; media_id: number; media_type: "ANIME" | "MANGA" | "NOVEL"; title: string; cover_url: string | null; status: string; progress: number; progress_total: number | null; score: number | null; notes: string | null; start_date: string | null; finish_date: string | null; repeat_count: number; priority: number; custom_tags: string[]; created_at: string; updated_at: string }; Insert: { user_id: string; media_id: number; media_type: "ANIME" | "MANGA" | "NOVEL"; title: string; cover_url?: string | null; status?: string; progress?: number; progress_total?: number | null; score?: number | null; notes?: string | null }; Update: { status?: string; progress?: number; progress_total?: number | null; score?: number | null; notes?: string | null; repeat_count?: number; priority?: number; custom_tags?: string[] } };
      favorites: { Row: { id: string; user_id: string; media_id: number; media_type: "ANIME" | "MANGA" | "NOVEL"; title: string; cover_url: string | null; created_at: string }; Insert: { user_id: string; media_id: number; media_type: "ANIME" | "MANGA" | "NOVEL"; title: string; cover_url?: string | null }; Update: never };
      notifications: { Row: { id: string; user_id: string; kind: string; title: string; message: string; data: Json; read_at: string | null; created_at: string }; Insert: never; Update: { read_at?: string | null } };
      user_settings: { Row: { user_id: string; theme: string; locale: string; notifications_email: boolean; notifications_push: boolean; list_visibility: string; adult_content: boolean; title_language: string; updated_at: string }; Insert: { user_id: string }; Update: { theme?: string; notifications_email?: boolean; notifications_push?: boolean; list_visibility?: string; adult_content?: boolean } };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
