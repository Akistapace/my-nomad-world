export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          level: number;
          xp: number;
          xp_to_next: number;
          rank: number;
          total_pins: number;
          character: Json;
          joined_at: string;
          created_at: string;
          is_admin: boolean;
          is_banned: boolean;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          level?: number;
          xp?: number;
          xp_to_next?: number;
          rank?: number;
          total_pins?: number;
          character?: Json;
          joined_at?: string;
          created_at?: string;
          is_admin?: boolean;
          is_banned?: boolean;
          deleted_at?: string | null;
        };
        Update: {
          username?: string;
          level?: number;
          xp?: number;
          xp_to_next?: number;
          rank?: number;
          total_pins?: number;
          character?: Json;
          is_admin?: boolean;
          is_banned?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          name: string;
          flag_emoji: string;
          continent: string;
          visited: boolean;
          visited_at: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          name: string;
          flag_emoji: string;
          continent: string;
          visited?: boolean;
          visited_at?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          visited?: boolean;
          visited_at?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      pins: {
        Row: {
          id: string;
          user_id: string;
          country_code: string;
          type: string;
          name: string;
          lat: number;
          lng: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          country_code: string;
          type: string;
          name: string;
          lat: number;
          lng: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          type?: string;
          name?: string;
          lat?: number;
          lng?: number;
          note?: string | null;
        };
        Relationships: [];
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          country_code: string;
          country_name: string;
          caption: string;
          likes: number;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          country_code: string;
          country_name: string;
          caption?: string;
          likes?: number;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          caption?: string;
          likes?: number;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      story_comments: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          text?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          type: string;
          difficulty: string;
          icon: string;
          progress: number;
          total: number;
          xp_reward: number;
          coin_reward: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          type: string;
          difficulty?: string;
          icon?: string;
          progress?: number;
          total?: number;
          xp_reward?: number;
          coin_reward?: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          progress?: number;
          completed?: boolean;
          xp_reward?: number;
          coin_reward?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      recalculate_ranks: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
