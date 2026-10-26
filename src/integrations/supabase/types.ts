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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      board_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          name: string
          organization: string
          statement: string
          title: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          organization: string
          statement: string
          title: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          organization?: string
          statement?: string
          title?: string
        }
        Relationships: []
      }
      briefing_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          interaction: string
          last_name: string
          message: string | null
          organization: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          interaction: string
          last_name: string
          message?: string | null
          organization: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interaction?: string
          last_name?: string
          message?: string | null
          organization?: string
          role?: string
        }
        Relationships: []
      }
      certification_interest: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      entity_onboarding_releases: {
        Row: {
          documents: Json
          entity: string
          id: string
          member_id: string
          notified_at: string | null
          notify_attempts: number
          notify_error: string | null
          notify_status: string
          reason: string | null
          released_at: string
          released_by: string
          role: string
          source: string
        }
        Insert: {
          documents?: Json
          entity: string
          id?: string
          member_id: string
          notified_at?: string | null
          notify_attempts?: number
          notify_error?: string | null
          notify_status?: string
          reason?: string | null
          released_at?: string
          released_by: string
          role: string
          source?: string
        }
        Update: {
          documents?: Json
          entity?: string
          id?: string
          member_id?: string
          notified_at?: string | null
          notify_attempts?: number
          notify_error?: string | null
          notify_status?: string
          reason?: string | null
          released_at?: string
          released_by?: string
          role?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_onboarding_releases_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_questions: {
        Row: {
          context: string | null
          created_at: string
          group_id: string | null
          id: string
          member_id: string
          priority: number
          question: string
          round_id: string
          source: string
          updated_at: string
          why_it_matters: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          member_id: string
          priority: number
          question: string
          round_id: string
          source: string
          updated_at?: string
          why_it_matters: string
        }
        Update: {
          context?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          member_id?: string
          priority?: number
          question?: string
          round_id?: string
          source?: string
          updated_at?: string
          why_it_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "question_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_questions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "question_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_communication_sends: {
        Row: {
          created_at: string
          email_key: string
          forum_key: string
          id: string
          member_id: string
          recipient_email: string
          sent_by: string | null
          status: string
          version: number
        }
        Insert: {
          created_at?: string
          email_key: string
          forum_key: string
          id?: string
          member_id: string
          recipient_email: string
          sent_by?: string | null
          status?: string
          version?: number
        }
        Update: {
          created_at?: string
          email_key?: string
          forum_key?: string
          id?: string
          member_id?: string
          recipient_email?: string
          sent_by?: string | null
          status?: string
          version?: number
        }
        Relationships: []
      }
      governance_reviews: {
        Row: {
          created_at: string
          decision: string
          details: Json
          id: string
          kind: string
          member_id: string
          notes: string | null
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          details?: Json
          id?: string
          kind: string
          member_id: string
          notes?: string | null
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          details?: Json
          id?: string
          kind?: string
          member_id?: string
          notes?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_reviews_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_settings: {
        Row: {
          eyebrow: string
          heading: string
          singleton: boolean
          subtext: string
          updated_at: string
        }
        Insert: {
          eyebrow?: string
          heading?: string
          singleton?: boolean
          subtext?: string
          updated_at?: string
        }
        Update: {
          eyebrow?: string
          heading?: string
          singleton?: boolean
          subtext?: string
          updated_at?: string
        }
        Relationships: []
      }
      leadership_team: {
        Row: {
          affiliation: string | null
          bio: string | null
          created_at: string
          id: string
          is_placeholder: boolean
          member_id: string | null
          name: string
          photo_path: string | null
          sort_order: number
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          affiliation?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_placeholder?: boolean
          member_id?: string | null
          name: string
          photo_path?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          affiliation?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_placeholder?: boolean
          member_id?: string | null
          name?: string
          photo_path?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leadership_team_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_calendar_holds: {
        Row: {
          created_at: string
          id: string
          kind: string
          last_error: string | null
          last_synced_at: string | null
          outlook_event_id: string | null
          poll_id: string
          slot_id: string
          status: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          last_synced_at?: string | null
          outlook_event_id?: string | null
          poll_id: string
          slot_id: string
          status?: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          last_synced_at?: string | null
          outlook_event_id?: string | null
          poll_id?: string
          slot_id?: string
          status?: string
          transaction_id?: string
        }
        Relationships: []
      }
      meeting_poll_notes: {
        Row: {
          member_id: string
          note: string | null
          poll_id: string
          responded_at: string
        }
        Insert: {
          member_id: string
          note?: string | null
          poll_id: string
          responded_at?: string
        }
        Update: {
          member_id?: string
          note?: string | null
          poll_id?: string
          responded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_poll_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_poll_notes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "meeting_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_poll_responses: {
        Row: {
          availability: string
          created_at: string
          id: string
          member_id: string
          poll_id: string
          slot_id: string
        }
        Insert: {
          availability: string
          created_at?: string
          id?: string
          member_id: string
          poll_id: string
          slot_id: string
        }
        Update: {
          availability?: string
          created_at?: string
          id?: string
          member_id?: string
          poll_id?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_poll_responses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "meeting_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_poll_responses_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "meeting_poll_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_poll_slots: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_poll_slots_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "meeting_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_polls: {
        Row: {
          auto_nudge_sent_at: string | null
          calendar_sync_error: string | null
          calendar_synced_at: string | null
          confirmed_slot_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          format: string
          id: string
          invited_member_ids: string[]
          location: string | null
          meeting_type: string
          respond_by: string | null
          status: string
          timezone: string | null
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          auto_nudge_sent_at?: string | null
          calendar_sync_error?: string | null
          calendar_synced_at?: string | null
          confirmed_slot_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          format?: string
          id?: string
          invited_member_ids?: string[]
          location?: string | null
          meeting_type: string
          respond_by?: string | null
          status?: string
          timezone?: string | null
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          auto_nudge_sent_at?: string | null
          calendar_sync_error?: string | null
          calendar_synced_at?: string | null
          confirmed_slot_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          format?: string
          id?: string
          invited_member_ids?: string[]
          location?: string | null
          meeting_type?: string
          respond_by?: string | null
          status?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: []
      }
      portal_activity: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          member_id: string | null
          metadata: Json
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          member_id?: string | null
          metadata?: Json
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          member_id?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portal_activity_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_document_acknowledgements: {
        Row: {
          acknowledged_at: string
          confirmed_by: string | null
          conflict_answer: string | null
          conflict_details: string | null
          consent: boolean
          document_id: string
          id: string
          initials: string
          ip_address: string | null
          kind: string
          member_id: string
          signature_data: string | null
          signed_copy_path: string | null
          signed_copy_sent_at: string | null
          signed_name: string | null
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string
          confirmed_by?: string | null
          conflict_answer?: string | null
          conflict_details?: string | null
          consent?: boolean
          document_id: string
          id?: string
          initials: string
          ip_address?: string | null
          kind?: string
          member_id: string
          signature_data?: string | null
          signed_copy_path?: string | null
          signed_copy_sent_at?: string | null
          signed_name?: string | null
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string
          confirmed_by?: string | null
          conflict_answer?: string | null
          conflict_details?: string | null
          consent?: boolean
          document_id?: string
          id?: string
          initials?: string
          ip_address?: string | null
          kind?: string
          member_id?: string
          signature_data?: string | null
          signed_copy_path?: string | null
          signed_copy_sent_at?: string | null
          signed_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_document_acknowledgements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "portal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_document_acknowledgements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_documents: {
        Row: {
          action: string
          audience_entity: string | null
          audience_role: string | null
          category: string
          classification: string
          classification_reviewed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          external_url: string | null
          file_path: string | null
          id: string
          is_forum_prep: boolean
          journey_stage: number | null
          journey_track: string | null
          member_id: string | null
          sort_order: number
          superseded_at: string | null
          supersedes_id: string | null
          title: string
          updated_at: string
          version_label: string | null
        }
        Insert: {
          action: string
          audience_entity?: string | null
          audience_role?: string | null
          category: string
          classification?: string
          classification_reviewed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          external_url?: string | null
          file_path?: string | null
          id?: string
          is_forum_prep?: boolean
          journey_stage?: number | null
          journey_track?: string | null
          member_id?: string | null
          sort_order?: number
          superseded_at?: string | null
          supersedes_id?: string | null
          title: string
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          action?: string
          audience_entity?: string | null
          audience_role?: string | null
          category?: string
          classification?: string
          classification_reviewed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          external_url?: string | null
          file_path?: string | null
          id?: string
          is_forum_prep?: boolean
          journey_stage?: number | null
          journey_track?: string | null
          member_id?: string | null
          sort_order?: number
          superseded_at?: string | null
          supersedes_id?: string | null
          title?: string
          updated_at?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_documents_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "portal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_email_sends: {
        Row: {
          created_at: string
          error: string | null
          id: string
          member_id: string
          recipient_email: string
          sent_by: string | null
          status: string
          subject: string
          template_id: string | null
          template_name: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          member_id: string
          recipient_email: string
          sent_by?: string | null
          status?: string
          subject: string
          template_id?: string | null
          template_name: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          member_id?: string
          recipient_email?: string
          sent_by?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_email_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "portal_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_subtext: string | null
          cta_url: string | null
          description: string | null
          eyebrow: string
          heading: string
          id: string
          name: string
          signatures: string | null
          subject: string
          system_key: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_subtext?: string | null
          cta_url?: string | null
          description?: string | null
          eyebrow?: string
          heading?: string
          id?: string
          name: string
          signatures?: string | null
          subject: string
          system_key?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_subtext?: string | null
          cta_url?: string | null
          description?: string | null
          eyebrow?: string
          heading?: string
          id?: string
          name?: string
          signatures?: string | null
          subject?: string
          system_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      portal_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          member_id: string
          message: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["portal_inquiry_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          member_id: string
          message: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["portal_inquiry_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          member_id?: string
          message?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["portal_inquiry_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_inquiries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_login_security: {
        Row: {
          created_at: string
          failed_attempts: number
          last_failed_at: string | null
          last_success_at: string | null
          normalized_email: string
          reset_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          last_failed_at?: string | null
          last_success_at?: string | null
          normalized_email: string
          reset_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          last_failed_at?: string | null
          last_success_at?: string | null
          normalized_email?: string
          reset_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      portal_members: {
        Row: {
          created_at: string
          dis_activated_at: string | null
          dis_appointment_ref: string | null
          documents_completed_at: string | null
          documents_released_at: string | null
          documents_reminder_sent_at: string | null
          email: string
          entity: Database["public"]["Enums"]["portal_entity"]
          first_access_at: string | null
          first_name: string
          forum_clearance_status: string
          forum_cleared_at: string | null
          forum_cleared_by: string | null
          forum_restrictions: string | null
          id: string
          invited_at: string
          is_candidate: boolean
          is_methodology_committee: boolean
          last_access_at: string | null
          last_name: string
          nda_entities: Database["public"]["Enums"]["portal_entity"] | null
          nda_reference: string | null
          nda_scope: string | null
          nda_verified_at: string | null
          nda_verified_by: string | null
          organization: string
          orientation_acknowledged_at: string | null
          package_status: Database["public"]["Enums"]["portal_package_status"]
          participates_in_forum: boolean
          professional_name: string | null
          prsc_activated_at: string | null
          prsc_appointment_ref: string | null
          reminder_sent_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          role_review_status: string
          status: Database["public"]["Enums"]["portal_member_status"]
          title: string | null
          updated_at: string
          user_id: string
          why_you: string
        }
        Insert: {
          created_at?: string
          dis_activated_at?: string | null
          dis_appointment_ref?: string | null
          documents_completed_at?: string | null
          documents_released_at?: string | null
          documents_reminder_sent_at?: string | null
          email: string
          entity: Database["public"]["Enums"]["portal_entity"]
          first_access_at?: string | null
          first_name: string
          forum_clearance_status?: string
          forum_cleared_at?: string | null
          forum_cleared_by?: string | null
          forum_restrictions?: string | null
          id?: string
          invited_at?: string
          is_candidate?: boolean
          is_methodology_committee?: boolean
          last_access_at?: string | null
          last_name: string
          nda_entities?: Database["public"]["Enums"]["portal_entity"] | null
          nda_reference?: string | null
          nda_scope?: string | null
          nda_verified_at?: string | null
          nda_verified_by?: string | null
          organization: string
          orientation_acknowledged_at?: string | null
          package_status?: Database["public"]["Enums"]["portal_package_status"]
          participates_in_forum?: boolean
          professional_name?: string | null
          prsc_activated_at?: string | null
          prsc_appointment_ref?: string | null
          reminder_sent_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          role_review_status?: string
          status?: Database["public"]["Enums"]["portal_member_status"]
          title?: string | null
          updated_at?: string
          user_id: string
          why_you: string
        }
        Update: {
          created_at?: string
          dis_activated_at?: string | null
          dis_appointment_ref?: string | null
          documents_completed_at?: string | null
          documents_released_at?: string | null
          documents_reminder_sent_at?: string | null
          email?: string
          entity?: Database["public"]["Enums"]["portal_entity"]
          first_access_at?: string | null
          first_name?: string
          forum_clearance_status?: string
          forum_cleared_at?: string | null
          forum_cleared_by?: string | null
          forum_restrictions?: string | null
          id?: string
          invited_at?: string
          is_candidate?: boolean
          is_methodology_committee?: boolean
          last_access_at?: string | null
          last_name?: string
          nda_entities?: Database["public"]["Enums"]["portal_entity"] | null
          nda_reference?: string | null
          nda_scope?: string | null
          nda_verified_at?: string | null
          nda_verified_by?: string | null
          organization?: string
          orientation_acknowledged_at?: string | null
          package_status?: Database["public"]["Enums"]["portal_package_status"]
          participates_in_forum?: boolean
          professional_name?: string | null
          prsc_activated_at?: string | null
          prsc_appointment_ref?: string | null
          reminder_sent_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          role_review_status?: string
          status?: Database["public"]["Enums"]["portal_member_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
          why_you?: string
        }
        Relationships: []
      }
      portal_profiles: {
        Row: {
          bio: string | null
          contact_requested: boolean
          created_at: string
          current_organization: string | null
          current_stage: number
          experience_answers: Json
          final_notes: string | null
          headshot_path: string | null
          id: string
          member_id: string
          preferred_email: string | null
          preferred_name: string | null
          preferred_phone: string | null
          professional_role: string | null
          questions: string | null
          reopened_at: string | null
          restriction_details: string | null
          restriction_status: string | null
          submitted_at: string | null
          updated_at: string
          visibility_instructions: Json
        }
        Insert: {
          bio?: string | null
          contact_requested?: boolean
          created_at?: string
          current_organization?: string | null
          current_stage?: number
          experience_answers?: Json
          final_notes?: string | null
          headshot_path?: string | null
          id?: string
          member_id: string
          preferred_email?: string | null
          preferred_name?: string | null
          preferred_phone?: string | null
          professional_role?: string | null
          questions?: string | null
          reopened_at?: string | null
          restriction_details?: string | null
          restriction_status?: string | null
          submitted_at?: string | null
          updated_at?: string
          visibility_instructions?: Json
        }
        Update: {
          bio?: string | null
          contact_requested?: boolean
          created_at?: string
          current_organization?: string | null
          current_stage?: number
          experience_answers?: Json
          final_notes?: string | null
          headshot_path?: string | null
          id?: string
          member_id?: string
          preferred_email?: string | null
          preferred_name?: string | null
          preferred_phone?: string | null
          professional_role?: string | null
          questions?: string | null
          reopened_at?: string | null
          restriction_details?: string | null
          restriction_status?: string | null
          submitted_at?: string | null
          updated_at?: string
          visibility_instructions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "portal_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
        ]
      }
      question_groups: {
        Row: {
          category: string
          consolidated_text: string
          created_at: string
          id: string
          list_target: string
          priority: number | null
          review_status: string
          round_id: string
          route: string | null
          source: string
        }
        Insert: {
          category?: string
          consolidated_text: string
          created_at?: string
          id?: string
          list_target?: string
          priority?: number | null
          review_status?: string
          round_id: string
          route?: string | null
          source?: string
        }
        Update: {
          category?: string
          consolidated_text?: string
          created_at?: string
          id?: string
          list_target?: string
          priority?: number | null
          review_status?: string
          round_id?: string
          route?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_groups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "question_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      question_notification_sends: {
        Row: {
          created_at: string
          error: string | null
          kind: string
          member_id: string
          round_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          kind: string
          member_id: string
          round_id: string
          status: string
        }
        Update: {
          created_at?: string
          error?: string | null
          kind?: string
          member_id?: string
          round_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_notification_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_notification_sends_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "question_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      question_outbound: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          prepared_by: string
          questions: Json
          recipient: string
          responses: string | null
          round_id: string
          shared_at: string | null
          unresolved: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          prepared_by: string
          questions: Json
          recipient: string
          responses?: string | null
          round_id: string
          shared_at?: string | null
          unresolved?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          prepared_by?: string
          questions?: Json
          recipient?: string
          responses?: string | null
          round_id?: string
          shared_at?: string | null
          unresolved?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_outbound_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "question_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      question_round_responses: {
        Row: {
          member_id: string
          round_id: string
          status: string
          updated_at: string
        }
        Insert: {
          member_id: string
          round_id: string
          status: string
          updated_at?: string
        }
        Update: {
          member_id?: string
          round_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_round_responses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "portal_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_round_responses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "question_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      question_rounds: {
        Row: {
          briefing_document_id: string | null
          created_at: string
          created_by: string | null
          deadline: string
          forum_key: string
          id: string
          opens_at: string
          status: string
          title: string
        }
        Insert: {
          briefing_document_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline: string
          forum_key: string
          id?: string
          opens_at: string
          status?: string
          title: string
        }
        Update: {
          briefing_document_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string
          forum_key?: string
          id?: string
          opens_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_rounds_briefing_document_id_fkey"
            columns: ["briefing_document_id"]
            isOneToOne: false
            referencedRelation: "portal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vanguard_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          property: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          property: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          property?: string
          role?: string
        }
        Relationships: []
      }
      vanguard_seat_tally: {
        Row: {
          application_count: number
          singleton: boolean
          updated_at: string
        }
        Insert: {
          application_count?: number
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          application_count?: number
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_vanguard_seats: {
        Args: never
        Returns: {
          filled: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "board_member"
        | "advisor"
        | "prsc_board_dis_advisor"
        | "prsc_advisor_dis_board"
        | "methodology_committee"
      portal_entity: "prsc" | "dis" | "both"
      portal_inquiry_status: "open" | "resolved"
      portal_member_status: "invited" | "active" | "revoked"
      portal_package_status:
        | "awaiting_profile"
        | "in_preparation"
        | "profile_received"
        | "package_ready"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "board_member",
        "advisor",
        "prsc_board_dis_advisor",
        "prsc_advisor_dis_board",
        "methodology_committee",
      ],
      portal_entity: ["prsc", "dis", "both"],
      portal_inquiry_status: ["open", "resolved"],
      portal_member_status: ["invited", "active", "revoked"],
      portal_package_status: [
        "awaiting_profile",
        "in_preparation",
        "profile_received",
        "package_ready",
      ],
    },
  },
} as const
