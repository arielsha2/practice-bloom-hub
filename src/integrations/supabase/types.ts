export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bot_configurations: {
        Row: {
          bot_key: string
          color: string | null
          created_at: string | null
          description_en: string | null
          description_he: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string | null
          name_en: string
          name_he: string
          system_prompt: string
          temperature: number | null
          updated_at: string | null
          welcome_message_en: string | null
          welcome_message_he: string | null
        }
        Insert: {
          bot_key: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_he?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          name_en: string
          name_he: string
          system_prompt: string
          temperature?: number | null
          updated_at?: string | null
          welcome_message_en?: string | null
          welcome_message_he?: string | null
        }
        Update: {
          bot_key?: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_he?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          name_en?: string
          name_he?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string | null
          welcome_message_en?: string | null
          welcome_message_he?: string | null
        }
        Relationships: []
      }
      bot_conversations: {
        Row: {
          bot_key: string
          created_at: string | null
          id: string
          last_message_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          bot_key: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          bot_key?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_conversations_bot_key_fkey"
            columns: ["bot_key"]
            isOneToOne: false
            referencedRelation: "bot_configurations"
            referencedColumns: ["bot_key"]
          },
        ]
      }
      bot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "bot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_user_memory: {
        Row: {
          bot_key: string
          created_at: string | null
          created_by: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          bot_key: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          bot_key?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_user_memory_bot_key_fkey"
            columns: ["bot_key"]
            isOneToOne: false
            referencedRelation: "bot_configurations"
            referencedColumns: ["bot_key"]
          },
        ]
      }
      content_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name_en: string
          name_he: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name_en: string
          name_he: string
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name_en?: string
          name_he?: string
          slug?: string
        }
        Relationships: []
      }
      content_tag_links: {
        Row: {
          content_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          created_at: string | null
          id: string
          name_en: string
          name_he: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_en: string
          name_he: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name_en?: string
          name_he?: string
          slug?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          language: string
          metadata: Json | null
          original_id: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          source: string | null
          status: string | null
          title: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          language?: string
          metadata?: Json | null
          original_id?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          source?: string | null
          status?: string | null
          title: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          language?: string
          metadata?: Json | null
          original_id?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          source?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_key: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_he: string
        }
        Insert: {
          course_key: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_he: string
        }
        Update: {
          course_key?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_he?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
          source?: string | null
        }
        Relationships: []
      }
      lesson_media_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          lesson_id: string
          media_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          lesson_id: string
          media_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          lesson_id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_media_links_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          lesson_id: string
          source: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          lesson_id: string
          source?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          lesson_id?: string
          source?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_key: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          title: string
        }
        Insert: {
          course_key?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
        }
        Update: {
          course_key?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_key_fkey"
            columns: ["course_key"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_key"]
          },
        ]
      }
      media_library: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          external_id: string | null
          file_format: string | null
          file_path: string | null
          id: string
          intended_use: Database["public"]["Enums"]["intended_use"] | null
          media_kind: Database["public"]["Enums"]["media_kind"]
          source: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          intended_use?: Database["public"]["Enums"]["intended_use"] | null
          media_kind: Database["public"]["Enums"]["media_kind"]
          source?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          intended_use?: Database["public"]["Enums"]["intended_use"] | null
          media_kind?: Database["public"]["Enums"]["media_kind"]
          source?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      qa_threads: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          lesson_id: string | null
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          lesson_id?: string | null
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          lesson_id?: string | null
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_threads_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          activated_at: string | null
          course_key: string
          created_at: string | null
          email: string
          enrolled_at: string | null
          full_name: string | null
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          course_key?: string
          created_at?: string | null
          email: string
          enrolled_at?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          course_key?: string
          created_at?: string | null
          email?: string
          enrolled_at?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          created_at: string | null
          id: string
          last_position_seconds: number | null
          last_watched_at: string | null
          lesson_id: string
          user_id: string
          video_id: string | null
          watched: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          last_watched_at?: string | null
          lesson_id: string
          user_id: string
          video_id?: string | null
          watched?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          last_watched_at?: string | null
          lesson_id?: string
          user_id?: string
          video_id?: string | null
          watched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      qa_threads_safe: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string | null
          id: string | null
          is_my_question: boolean | null
          is_public: boolean | null
          lesson_id: string | null
          question: string | null
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string | null
          is_my_question?: never
          is_public?: boolean | null
          lesson_id?: string | null
          question?: string | null
          user_id?: never
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string | null
          id?: string | null
          is_my_question?: never
          is_public?: boolean | null
          lesson_id?: string | null
          question?: string | null
          user_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "qa_threads_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_course_member: { Args: { _user_id: string }; Returns: boolean }
      is_enrolled_in_course: {
        Args: { _course_key: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "course_member"
      intended_use: "intro" | "practice" | "deepening" | "reference" | "bonus"
      media_kind: "video" | "document" | "presentation" | "audio" | "link"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "course_member"],
      intended_use: ["intro", "practice", "deepening", "reference", "bonus"],
      media_kind: ["video", "document", "presentation", "audio", "link"],
    },
  },
} as const
