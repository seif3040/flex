export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          encrypted_key: string;
          key_hint: string | null;
          label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_key: string;
          key_hint?: string | null;
          label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_key?: string;
          key_hint?: string | null;
          label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          system_prompt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          model_id: string;
          system_prompt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title?: string;
          model_id: string;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          model_id?: string;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          model_id: string | null;
          parent_id: string | null;
          token_count: number | null;
          finish_reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          model_id?: string | null;
          parent_id?: string | null;
          token_count?: number | null;
          finish_reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          model_id?: string | null;
          parent_id?: string | null;
          token_count?: number | null;
          finish_reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          }
        ];
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          project_id: string | null;
          message_id: string | null;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          project_id?: string | null;
          message_id?: string | null;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          project_id?: string | null;
          message_id?: string | null;
          storage_path?: string;
          original_name?: string;
          mime_type?: string;
          size_bytes?: number;
          extracted_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          }
        ];
      };
      artifacts: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          message_id: string;
          title: string;
          language: string;
          content: string;
          version: number;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id: string;
          message_id: string;
          title: string;
          language?: string;
          content: string;
          version?: number;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string;
          message_id?: string;
          title?: string;
          language?: string;
          content?: string;
          version?: number;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artifacts_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artifacts_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artifacts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "artifacts";
            referencedColumns: ["id"];
          }
        ];
      };
      memory_entries: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      message_role: MessageRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
