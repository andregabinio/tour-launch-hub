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
      acoes: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          dependencia_de: string | null
          descricao: string
          id: string
          macro_etapa_id: string
          prioridade: string
          responsavel: string | null
          situacao_prazo: string
          status: string
          tempo_estimado: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          dependencia_de?: string | null
          descricao?: string
          id: string
          macro_etapa_id: string
          prioridade?: string
          responsavel?: string | null
          situacao_prazo?: string
          status?: string
          tempo_estimado?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          dependencia_de?: string | null
          descricao?: string
          id?: string
          macro_etapa_id?: string
          prioridade?: string
          responsavel?: string | null
          situacao_prazo?: string
          status?: string
          tempo_estimado?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_dependencia_de_fkey"
            columns: ["dependencia_de"]
            isOneToOne: false
            referencedRelation: "acoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_macro_etapa_id_fkey"
            columns: ["macro_etapa_id"]
            isOneToOne: false
            referencedRelation: "macro_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_etapas: {
        Row: {
          cor: string
          cor_bg: string
          cor_border: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string
          cor_bg?: string
          cor_border?: string
          descricao?: string | null
          id: string
          nome: string
          ordem?: number
        }
        Update: {
          cor?: string
          cor_bg?: string
          cor_border?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nome?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      subtarefas: {
        Row: {
          acao_id: string
          created_at: string
          id: string
          responsavel: string | null
          status: string
          tempo_estimado: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          acao_id: string
          created_at?: string
          id?: string
          responsavel?: string | null
          status?: string
          tempo_estimado?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          acao_id?: string
          created_at?: string
          id?: string
          responsavel?: string | null
          status?: string
          tempo_estimado?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtarefas_acao_id_fkey"
            columns: ["acao_id"]
            isOneToOne: false
            referencedRelation: "acoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
