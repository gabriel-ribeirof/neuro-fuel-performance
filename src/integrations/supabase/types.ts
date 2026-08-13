// Tipos locais do schema do Supabase (Neuronutri iEsports).
// O arquivo gerado automaticamente pelo Lovable ainda não cobre as tabelas
// customizadas; este preenche a lacuna até a integração nativa regerar.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'responsavel' | 'profissional' | 'admin';
          nome: string;
          telefone: string;
          profissional_slug: 'amanda' | 'manuela' | 'leticia' | 'gabriel' | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'responsavel' | 'profissional' | 'admin';
          nome?: string;
          telefone?: string;
          profissional_slug?: 'amanda' | 'manuela' | 'leticia' | 'gabriel' | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      atletas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          sobrenome: string;
          idade: number;
          clube: string;
          email: string | null;
          telefone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          sobrenome: string;
          idade: number;
          clube: string;
          email?: string | null;
          telefone: string;
        };
        Update: Partial<Database['public']['Tables']['atletas']['Insert']>;
        Relationships: [];
      };
      contratos: {
        Row: {
          id: string;
          user_id: string;
          atleta_id: string;
          pacote_slug: string;
          valor_centavos: number;
          status: 'pendente' | 'pago' | 'cancelado';
          mercado_pago_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          atleta_id: string;
          pacote_slug: string;
          valor_centavos: number;
          status?: 'pendente' | 'pago' | 'cancelado';
          mercado_pago_payment_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contratos']['Insert']>;
        Relationships: [];
      };
      agendamentos: {
        Row: {
          id: string;
          contrato_id: string;
          atleta_id: string;
          profissional_slug: 'amanda' | 'manuela' | 'leticia' | 'gabriel';
          tipo_sessao: string;
          data: string;
          horario: string;
          duracao_min: number;
          status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado';
          created_at: string;
        };
        Insert: {
          id?: string;
          contrato_id: string;
          atleta_id: string;
          profissional_slug: 'amanda' | 'manuela' | 'leticia' | 'gabriel';
          tipo_sessao: string;
          data: string;
          horario: string;
          duracao_min?: number;
          status?: 'agendado' | 'confirmado' | 'cancelado' | 'realizado';
        };
        Update: Partial<Database['public']['Tables']['agendamentos']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      horarios_ocupados: {
        Row: {
          data: string;
          horario: string;
          duracao_min: number;
          profissional_slug: 'amanda' | 'manuela' | 'leticia' | 'gabriel';
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};