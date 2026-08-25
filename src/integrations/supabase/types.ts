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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      espacios: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          tipo?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      inspeccion_items: {
        Row: {
          cantidad: number
          condicion: Database["public"]["Enums"]["condicion_item"]
          id: string
          inspeccion_id: string
          nombre: string
          nota: string | null
        }
        Insert: {
          cantidad?: number
          condicion?: Database["public"]["Enums"]["condicion_item"]
          id?: string
          inspeccion_id: string
          nombre: string
          nota?: string | null
        }
        Update: {
          cantidad?: number
          condicion?: Database["public"]["Enums"]["condicion_item"]
          id?: string
          inspeccion_id?: string
          nombre?: string
          nota?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspeccion_items_inspeccion_id_fkey"
            columns: ["inspeccion_id"]
            isOneToOne: false
            referencedRelation: "inspecciones"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecciones: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_inspeccion"]
          created_at: string
          espacio_id: string | null
          eventualidad: boolean
          id: string
          observaciones: string | null
          user_id: string
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_inspeccion"]
          created_at?: string
          espacio_id?: string | null
          eventualidad?: boolean
          id?: string
          observaciones?: string | null
          user_id: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_inspeccion"]
          created_at?: string
          espacio_id?: string | null
          eventualidad?: boolean
          id?: string
          observaciones?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecciones_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      materiales_inventario: {
        Row: {
          activo: boolean
          cantidad: number
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_material"]
          familia: string
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_inventario"]
          ubicacion: string | null
          unidad: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cantidad?: number
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_material"]
          familia?: string
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_inventario"]
          ubicacion?: string | null
          unidad?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cantidad?: number
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_material"]
          familia?: string
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_inventario"]
          ubicacion?: string | null
          unidad?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string
          destinatario_id: string
          id: string
          inspeccion_id: string | null
          leida: boolean
          mensaje: string
          titulo: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          id?: string
          inspeccion_id?: string | null
          leida?: boolean
          mensaje: string
          titulo: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          id?: string
          inspeccion_id?: string | null
          leida?: boolean
          mensaje?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_inspeccion_id_fkey"
            columns: ["inspeccion_id"]
            isOneToOne: false
            referencedRelation: "inspecciones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coordinador" | "aprendiz" | "almacenista"
      categoria_inspeccion:
        | "almacen"
        | "papeleria"
        | "limpieza"
        | "equipos"
        | "mesas_trabajo"
        | "maquinas_herramientas"
        | "laboratorio"
      condicion_item: "operativo" | "observacion" | "averiado" | "faltante"
      estado_material: "disponible" | "observacion" | "agotado"
      tipo_inventario:
        | "maquinas_herramientas"
        | "mesas_trabajo"
        | "almacen"
        | "papeleria"
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
      app_role: ["coordinador", "aprendiz", "almacenista"],
      categoria_inspeccion: [
        "almacen",
        "papeleria",
        "limpieza",
        "equipos",
        "mesas_trabajo",
        "maquinas_herramientas",
        "laboratorio",
      ],
      condicion_item: ["operativo", "observacion", "averiado", "faltante"],
      estado_material: ["disponible", "observacion", "agotado"],
      tipo_inventario: [
        "maquinas_herramientas",
        "mesas_trabajo",
        "almacen",
        "papeleria",
      ],
    },
  },
} as const
