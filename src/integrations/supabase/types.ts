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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          password_hash: string
          password_hash_bcrypt: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          password_hash: string
          password_hash_bcrypt?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          password_hash?: string
          password_hash_bcrypt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_active: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_active?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_active?: string | null
          user_id?: string
        }
        Relationships: []
      }
      batch_items: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          order_index: number
          product_url: string
          request_id: string | null
          result_url: string | null
          status: string
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_index: number
          product_url: string
          request_id?: string | null
          result_url?: string | null
          status?: string
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_index?: number
          product_url?: string
          request_id?: string | null
          result_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          completed_at: string | null
          completed_count: number
          created_at: string | null
          failed_count: number
          id: string
          settings: Json | null
          status: string
          tool_name: string
          total_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_count?: number
          created_at?: string | null
          failed_count?: number
          id?: string
          settings?: Json | null
          status?: string
          tool_name?: string
          total_count: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_count?: number
          created_at?: string | null
          failed_count?: number
          id?: string
          settings?: Json | null
          status?: string
          tool_name?: string
          total_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string
          content_blocks: Json
          cover_image_url: string
          created_at: string
          excerpt: string
          id: string
          is_published: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          title_highlight: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content_blocks?: Json
          cover_image_url: string
          created_at?: string
          excerpt: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          title_highlight?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content_blocks?: Json
          cover_image_url?: string
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          title_highlight?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cancellation_feedback: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      case_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          category_id: string | null
          client_logo_url: string | null
          client_name: string
          comparison_left_image_url: string | null
          comparison_left_label: string
          comparison_right_image_url: string | null
          comparison_right_label: string
          created_at: string
          header_bg_color: string
          hero_image_url: string | null
          id: string
          intro_text: string
          is_published: boolean
          key_results: Json
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_image_url: string | null
          problem_text: string
          published_at: string | null
          quote_attribution: string
          quote_text: string
          slug: string
          solution_text: string
          stats: Json
          subtitle: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          client_logo_url?: string | null
          client_name: string
          comparison_left_image_url?: string | null
          comparison_left_label?: string
          comparison_right_image_url?: string | null
          comparison_right_label?: string
          created_at?: string
          header_bg_color?: string
          hero_image_url?: string | null
          id?: string
          intro_text?: string
          is_published?: boolean
          key_results?: Json
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          problem_text?: string
          published_at?: string | null
          quote_attribution?: string
          quote_text?: string
          slug: string
          solution_text?: string
          stats?: Json
          subtitle?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          client_logo_url?: string | null
          client_name?: string
          comparison_left_image_url?: string | null
          comparison_left_label?: string
          comparison_right_image_url?: string | null
          comparison_right_label?: string
          created_at?: string
          header_bg_color?: string
          hero_image_url?: string | null
          id?: string
          intro_text?: string
          is_published?: boolean
          key_results?: Json
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          problem_text?: string
          published_at?: string | null
          quote_attribution?: string
          quote_text?: string
          slug?: string
          solution_text?: string
          stats?: Json
          subtitle?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_history: {
        Row: {
          action_type: string
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type?: string
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          total_credits_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_credits_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_credits_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_models: {
        Row: {
          created_at: string
          description: string | null
          gender: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          price_cents?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      default_models: {
        Row: {
          age_category: string
          body_type: string
          created_at: string
          ethnicity: string
          gender: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          use_case: string
        }
        Insert: {
          age_category?: string
          body_type?: string
          created_at?: string
          ethnicity?: string
          gender?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          use_case?: string
        }
        Update: {
          age_category?: string
          body_type?: string
          created_at?: string
          ethnicity?: string
          gender?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          use_case?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          flow_key: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          flow_key: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          flow_key?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flatlay_style_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      flatlay_styles: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          output_type: string
          sort_order: number
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          output_type?: string
          sort_order?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          output_type?: string
          sort_order?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flatlay_styles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "flatlay_style_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flatlay_styles_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "flatlay_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      flatlay_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "flatlay_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "flatlay_style_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flatlay_user_styles: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt: string
          created_at: string
          id: string
          is_visible: boolean
          sort_order: number
          src_url: string
          type: string
          updated_at: string
        }
        Insert: {
          alt?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          src_url: string
          type?: string
          updated_at?: string
        }
        Update: {
          alt?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          src_url?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      generation_comments: {
        Row: {
          content: string
          created_at: string
          generation_id: string
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          generation_id: string
          id?: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          generation_id?: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_comments_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "generation_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_likes: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_likes_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          created_at: string | null
          generated_image_url: string | null
          id: string
          is_public: boolean
          original_image_url: string
          prompt: string
          status: string
          tool_name: string | null
          user_id: string
          watermarked_image_url: string | null
        }
        Insert: {
          created_at?: string | null
          generated_image_url?: string | null
          id?: string
          is_public?: boolean
          original_image_url: string
          prompt: string
          status?: string
          tool_name?: string | null
          user_id: string
          watermarked_image_url?: string | null
        }
        Update: {
          created_at?: string | null
          generated_image_url?: string | null
          id?: string
          is_public?: boolean
          original_image_url?: string
          prompt?: string
          status?: string
          tool_name?: string | null
          user_id?: string
          watermarked_image_url?: string | null
        }
        Relationships: []
      }
      industry_pages: {
        Row: {
          case_1_id: string | null
          case_2_id: string | null
          case_3_id: string | null
          cases_section_title: string
          category_id: string | null
          created_at: string
          faq_items: Json
          faq_section_title: string
          header_bg_color: string
          hero_image_url: string | null
          id: string
          industry_name: string
          intro_body: string
          intro_title: string
          is_published: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          recognition_bullets: Json
          recognition_title: string
          slug: string
          solution_body: string
          solution_title: string
          updated_at: string
        }
        Insert: {
          case_1_id?: string | null
          case_2_id?: string | null
          case_3_id?: string | null
          cases_section_title?: string
          category_id?: string | null
          created_at?: string
          faq_items?: Json
          faq_section_title?: string
          header_bg_color?: string
          hero_image_url?: string | null
          id?: string
          industry_name: string
          intro_body?: string
          intro_title?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          recognition_bullets?: Json
          recognition_title?: string
          slug: string
          solution_body?: string
          solution_title?: string
          updated_at?: string
        }
        Update: {
          case_1_id?: string | null
          case_2_id?: string | null
          case_3_id?: string | null
          cases_section_title?: string
          category_id?: string | null
          created_at?: string
          faq_items?: Json
          faq_section_title?: string
          header_bg_color?: string
          hero_image_url?: string | null
          id?: string
          industry_name?: string
          intro_body?: string
          intro_title?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          recognition_bullets?: Json
          recognition_title?: string
          slug?: string
          solution_body?: string
          solution_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_pages_case_1_id_fkey"
            columns: ["case_1_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_pages_case_2_id_fkey"
            columns: ["case_2_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_pages_case_3_id_fkey"
            columns: ["case_3_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_pages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_videos: {
        Row: {
          created_at: string
          id: string
          tool_name: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          tool_name: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          tool_name?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      lighting_presets: {
        Row: {
          background_color: string
          background_name: string
          created_at: string
          id: string
          image_url: string
          lighting_style: string
        }
        Insert: {
          background_color: string
          background_name: string
          created_at?: string
          id?: string
          image_url: string
          lighting_style: string
        }
        Update: {
          background_color?: string
          background_name?: string
          created_at?: string
          id?: string
          image_url?: string
          lighting_style?: string
        }
        Relationships: []
      }
      onboarding_data: {
        Row: {
          company_name: string
          company_size: string | null
          company_website: string | null
          created_at: string | null
          creatives_tested: string | null
          id: string
          monthly_ad_spend: string | null
          referral_source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          creatives_tested?: string | null
          id?: string
          monthly_ad_spend?: string | null
          referral_source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          creatives_tested?: string | null
          id?: string
          monthly_ad_spend?: string | null
          referral_source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ambience_walkthrough_completed: boolean
          ambience_walkthrough_step: number
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          knowledge_base_bonus_claimed: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          plan: string
          referral_source: string | null
          role: string | null
          tool_walkthroughs_seen: Json
          updated_at: string | null
          walkthrough_completed: boolean
          walkthrough_step: number
          website: string | null
        }
        Insert: {
          ambience_walkthrough_completed?: boolean
          ambience_walkthrough_step?: number
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          knowledge_base_bonus_claimed?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan?: string
          referral_source?: string | null
          role?: string | null
          tool_walkthroughs_seen?: Json
          updated_at?: string | null
          walkthrough_completed?: boolean
          walkthrough_step?: number
          website?: string | null
        }
        Update: {
          ambience_walkthrough_completed?: boolean
          ambience_walkthrough_step?: number
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          knowledge_base_bonus_claimed?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan?: string
          referral_source?: string | null
          role?: string | null
          tool_walkthroughs_seen?: Json
          updated_at?: string | null
          walkthrough_completed?: boolean
          walkthrough_step?: number
          website?: string | null
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          html_content: string
          id: string
          recipient_emails: Json
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          recipient_emails: Json
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          recipient_emails?: Json
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          admin_only: boolean
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          admin_only?: boolean
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          admin_only?: boolean
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ip_tracking: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchased_models: {
        Row: {
          id: string
          model_id: string
          purchased_at: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          model_id: string
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          model_id?: string
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchased_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "custom_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tool_access: {
        Row: {
          created_at: string
          has_access: boolean
          id: string
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_access?: boolean
          id?: string
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_access?: boolean
          id?: string
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tool_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      deduct_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      get_profile_names: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
