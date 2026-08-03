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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
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
      cohorts: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_he: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_he: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_he?: string
          start_date?: string | null
        }
        Relationships: []
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
          cohort_id: string | null
          course_key: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_he: string
        }
        Insert: {
          cohort_id?: string | null
          course_key: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_he: string
        }
        Update: {
          cohort_id?: string | null
          course_key?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_he?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
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
      media_folder_assignments: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          media_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          media_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_folder_assignments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          external_id: string | null
          file_format: string | null
          file_path: string | null
          folder: string | null
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
          folder?: string | null
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
          folder?: string | null
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
      mentor_ai_settings: {
        Row: {
          id: string
          max_tokens: number
          model: string
          system_prompt_en: string
          system_prompt_he: string
          temperature: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          max_tokens?: number
          model?: string
          system_prompt_en: string
          system_prompt_he: string
          temperature?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          max_tokens?: number
          model?: string
          system_prompt_en?: string
          system_prompt_he?: string
          temperature?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      mentor_ai_settings_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          max_tokens: number
          model: string
          system_prompt_en: string
          system_prompt_he: string
          temperature: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          max_tokens: number
          model: string
          system_prompt_en: string
          system_prompt_he: string
          temperature: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          max_tokens?: number
          model?: string
          system_prompt_en?: string
          system_prompt_he?: string
          temperature?: number
        }
        Relationships: []
      }
      mentor_conversations: {
        Row: {
          id: string
          insight_count: number
          language: string
          messages: Json
          messages_archive: Json | null
          session_id: string
          stage: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          insight_count?: number
          language?: string
          messages?: Json
          messages_archive?: Json | null
          session_id?: string
          stage?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          insight_count?: number
          language?: string
          messages?: Json
          messages_archive?: Json | null
          session_id?: string
          stage?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_handoff_events: {
        Row: {
          bot_key: string
          conversation_id: string | null
          created_at: string
          id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          bot_key: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          source: string
          status: string
          user_id: string
        }
        Update: {
          bot_key?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_provider_events: {
        Row: {
          created_at: string
          error_message: string | null
          fallback_used: boolean
          id: string
          provider: string
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          provider: string
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          provider?: string
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      mentor_notebooks: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_testimonials: {
        Row: {
          author: string | null
          body_text: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          language: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind: string
          language: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          language?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      plan_changes: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_plan: string
          old_plan: string | null
          source: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_plan: string
          old_plan?: string | null
          source?: string
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_plan?: string
          old_plan?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          mailing_list_consent: boolean
          mailing_list_consent_at: string | null
          meshulam_transaction_id: string | null
          password_set: boolean
          plan: string
          plan_updated_at: string | null
          trial_reminder_sent_at: string | null
          trial_start_date: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          mailing_list_consent?: boolean
          mailing_list_consent_at?: string | null
          meshulam_transaction_id?: string | null
          password_set?: boolean
          plan?: string
          plan_updated_at?: string | null
          trial_reminder_sent_at?: string | null
          trial_start_date?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          mailing_list_consent?: boolean
          mailing_list_consent_at?: string | null
          meshulam_transaction_id?: string | null
          password_set?: boolean
          plan?: string
          plan_updated_at?: string | null
          trial_reminder_sent_at?: string | null
          trial_start_date?: string | null
        }
        Relationships: []
      }
      promo_settings: {
        Row: {
          countdown_target: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          countdown_target?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          countdown_target?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      qa_ai_settings: {
        Row: {
          id: string
          max_tokens: number
          model: string
          system_prompt: string
          temperature: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          max_tokens?: number
          model?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          max_tokens?: number
          model?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      qa_ai_settings_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          max_tokens: number
          model: string
          system_prompt: string
          temperature: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          max_tokens: number
          model: string
          system_prompt: string
          temperature: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          max_tokens?: number
          model?: string
          system_prompt?: string
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "qa_ai_settings_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      signup_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          last_sent_at: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          last_sent_at?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
        }
        Relationships: []
      }
      stuck_point_events: {
        Row: {
          category: string
          created_at: string
          id: string
          stage: string | null
          text: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          stage?: string | null
          text: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          stage?: string | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          activated_at: string | null
          cohort_id: string | null
          course_key: string | null
          created_at: string | null
          email: string
          enrolled_at: string | null
          full_name: string | null
          id: string
          notes: string | null
          pending_mentor: boolean
          pending_role: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          cohort_id?: string | null
          course_key?: string | null
          created_at?: string | null
          email: string
          enrolled_at?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          pending_mentor?: boolean
          pending_role?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          cohort_id?: string | null
          course_key?: string | null
          created_at?: string | null
          email?: string
          enrolled_at?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          pending_mentor?: boolean
          pending_role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_checkins: {
        Row: {
          answer_numeric: number | null
          answer_value: string | null
          created_at: string | null
          id: string
          question_key: string
          user_id: string | null
        }
        Insert: {
          answer_numeric?: number | null
          answer_value?: string | null
          created_at?: string | null
          id?: string
          question_key: string
          user_id?: string | null
        }
        Update: {
          answer_numeric?: number | null
          answer_value?: string | null
          created_at?: string | null
          id?: string
          question_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      therapist_journeys: {
        Row: {
          checkin_due: boolean | null
          checkin_question: string | null
          checkin_stage: string | null
          completed_stages: string[]
          connection_bridge_output: Json | null
          contact_finder_output: Json | null
          created_at: string
          health_score: number | null
          id: string
          niche_output: Json | null
          pricing_output: Json | null
          reflection: Json
          score_breakdown: Json | null
          score_history: Json | null
          score_updated_at: string | null
          self_presentation_output: Json | null
          step_number: number
          stuck_points: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_due?: boolean | null
          checkin_question?: string | null
          checkin_stage?: string | null
          completed_stages?: string[]
          connection_bridge_output?: Json | null
          contact_finder_output?: Json | null
          created_at?: string
          health_score?: number | null
          id?: string
          niche_output?: Json | null
          pricing_output?: Json | null
          reflection?: Json
          score_breakdown?: Json | null
          score_history?: Json | null
          score_updated_at?: string | null
          self_presentation_output?: Json | null
          step_number?: number
          stuck_points?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_due?: boolean | null
          checkin_question?: string | null
          checkin_stage?: string | null
          completed_stages?: string[]
          connection_bridge_output?: Json | null
          contact_finder_output?: Json | null
          created_at?: string
          health_score?: number | null
          id?: string
          niche_output?: Json | null
          pricing_output?: Json | null
          reflection?: Json
          score_breakdown?: Json | null
          score_history?: Json | null
          score_updated_at?: string | null
          self_presentation_output?: Json | null
          step_number?: number
          stuck_points?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      therapist_leads: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          phone: string
          slug: string
          therapist_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          phone: string
          slug: string
          therapist_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          slug?: string
          therapist_user_id?: string
        }
        Relationships: []
      }
      therapist_score_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          score_delta: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          score_delta?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          score_delta?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      therapist_websites: {
        Row: {
          calendar_link: string | null
          contact_method: string
          content: Json
          created_at: string
          id: string
          is_published: boolean
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_link?: string | null
          contact_method?: string
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_link?: string | null
          contact_method?: string
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ai_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          key_hint: string
          last_error: string | null
          last_validated_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          key_hint: string
          last_error?: string | null
          last_validated_at?: string | null
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          key_hint?: string
          last_error?: string | null
          last_validated_at?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      admin_list_unconfirmed_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_user_access: {
        Args: { _user_id: string }
        Returns: {
          has_paid: boolean
          plan: string
          trial_active: boolean
          trial_ends_at: string
        }[]
      }
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
      is_mentor_trial_open: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "course_member" | "mentor"
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
      app_role: ["admin", "user", "course_member", "mentor"],
      intended_use: ["intro", "practice", "deepening", "reference", "bonus"],
      media_kind: ["video", "document", "presentation", "audio", "link"],
    },
  },
} as const
