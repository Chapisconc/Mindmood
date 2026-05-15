// ============================================================
// Servicio de gestión de contactos (solicitudes de ayuda)
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Capa de abstracción sobre las RPC y tablas de
//   Supabase para el flujo de contactos entre usuarios y
//   administradores (crisis/consulta).
// ============================================================

// --- Importar el cliente de Supabase (instancia única) ---
import { supabase } from "./supabase";

// === Exportación del objeto contactoService ===
// Se exporta como objeto literal con métodos async para que
// los componentes puedan importarlo y llamar a sus funciones
// sin necesidad de instanciar nada.
export const contactService = {
  // ================================================================
  // requestContact (usuario → admin)
  // Crea una solicitud de contacto desde el usuario hacia un admin.
  // Parámetros:
  //   userId  — UUID del usuario que solicita ayuda
  //   message — Mensaje opcional del usuario (string)
  // Retorna:  { data, error } con el registro insertado
  // Efectos:  Inserta un registro en la tabla contact_requests
  // ================================================================
  async requestContact(userId, message = "") {
    // Validar que el usuario esté autenticado antes de insertar
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado.") };
    }
    const { data, error } = await supabase
      .from("contact_requests")        // Tabla de solicitudes
      .insert([                        // Insertar nueva solicitud
        {
          user_id: userId,             // Quién solicita
          initiator: "user",           // Iniciador = usuario (no admin)
          message: message,            // Mensaje de texto libre
          status: "pending",           // Estado inicial: pendiente
        },
      ])
      .select();                       // Devolver el registro creado

    return { data, error };
  },

  // ================================================================
  // getMyRequests
  // Obtiene todas las solicitudes de contacto del usuario actual.
  // IMPORTANTE: No se hace join con admin:admin_id porque RLS
  //   bloquea la vista del perfil del admin en solicitudes pendientes.
  // Retorna:  { data, error } — arreglo de solicitudes ordenado
  // Efectos:  Consulta SELECT a la tabla contact_requests
  // ================================================================
  async getMyRequests() {
    // Sin join a admin:admin_id — RLS bloquea ver perfil del admin en solicitudes pendientes
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")                                         // Todas las columnas
      .order("created_at", { ascending: false });           // Más recientes primero

    return { data, error };
  },

  // ================================================================
  // adminInitiateContact (admin → usuario)
  // El administrador inicia un contacto con un usuario específico,
  // referenciando una entrada del diario (entryId).
  // Parámetros:
  //   userId          — UUID del usuario destino
  //   entryId         — UUID de la entrada del diario relacionada
  //   initialMessage  — Mensaje inicial del admin
  // Retorna:  { data, error } — resultado de la RPC
  // Efectos:  Llama a la función PostgreSQL admin_initiate_contact
  // ================================================================
  async adminInitiateContact(userId, entryId, initialMessage) {
    const { data, error } = await supabase.rpc("admin_initiate_contact", {
      target_user_id: userId,
      entry_id: entryId,
      message: initialMessage,
    });

    return { data, error };
  },

  // ================================================================
  // acceptCrisEntry
  // Acepta una solicitud de crisis y muestra los datos de contacto
  // al usuario. El admin "acepta" atender la solicitud.
  // Parámetros:
  //   requestId — UUID de la solicitud a aceptar
  // Retorna:  { data, error }
  // Efectos:  Llama a la RPC accept_cris_entry_and_show_contact
  // ================================================================
  async acceptCrisEntry(requestId) {
    const { data, error } = await supabase.rpc(
      "accept_cris_entry_and_show_contact",
      {
        request_id: requestId,
      }
    );

    // Si hay error, devolver data como null; si no, error como null
    if (error) return { data: null, error };
    return { data, error: null };
  },

  // ================================================================
  // rejectCrisEntry
  // Rechaza una solicitud de crisis.
  // Parámetros:
  //   requestId — UUID de la solicitud a rechazar
  // Retorna:  { data, error }
  // Efectos:  Llama a la RPC reject_cris_entry
  // ================================================================
  async rejectCrisEntry(requestId) {
    const { data, error } = await supabase.rpc("reject_cris_entry", {
      request_id: requestId,
    });

    return { data, error };
  },

  // ================================================================
  // updateMyContactInfo
  // Actualiza la información de contacto del admin (email, teléfono,
  // nombre, y estado activo/inactivo).
  // Parámetros:
  //   email    — Nuevo email de contacto (string)
  //   phone    — Nuevo teléfono (string)
  //   name     — Nuevo nombre visible (string)
  //   isActive — Booleano: true si el contacto está activo
  // Retorna:  { data, error }
  // Efectos:  Llama a la RPC admin_update_contact_info
  // ================================================================
  async updateMyContactInfo(email, phone, name, isActive) {
    const { data, error } = await supabase.rpc("admin_update_contact_info", {
      new_email: email,
      new_phone: phone,
      new_name: name,
      is_active: isActive,
    });

    return { data, error };
  },

  // ================================================================
  // getContactInfo
  // Obtiene la información de contacto asociada a una solicitud
  // (visible para el usuario cuando el admin acepta).
  // Parámetros:
  //   requestId — UUID de la solicitud
  // Retorna:  { data, error } — datos de contacto del admin
  // Efectos:  Llama a la RPC get_contact_info_for_user
  // ================================================================
  async getContactInfo(requestId) {
    const { data, error } = await supabase.rpc("get_contact_info_for_user", {
      request_id: requestId,
    });

    return { data, error };
  },

  // ================================================================
  // getUserStreak
  // Obtiene la racha actual de días consecutivos del usuario.
  // Parámetros:
  //   userId — UUID del usuario a consultar
  // Retorna:  { streak: number | null, error }
  //   Nota: se renombra 'data' a 'streak' para claridad semántica
  // Efectos:  Llama a la RPC get_user_streak (función SQL escalar)
  // ================================================================
  async getUserStreak(userId) {
    const { data, error } = await supabase.rpc("get_user_streak", {
      target_user_id: userId,
    });

    // Renombrar 'data' → 'streak' para semántica más clara en el consumidor
    return { streak: data, error };
  },
};
