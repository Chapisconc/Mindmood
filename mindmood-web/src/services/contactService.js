import { supabase } from "./supabase";

export const contactService = {
  async requestContact(userId, message = "") {
    if (!userId) {
      return { data: null, error: new Error("Usuario no autenticado.") };
    }
    const { data, error } = await supabase
      .from("contact_requests")
      .insert([
        {
          user_id: userId,
          initiator: "user",
          message: message,
          status: "pending",
        },
      ])
      .select();

    return { data, error };
  },

  async getMyRequests() {
    const { data, error } = await supabase
      .from("contact_requests")
      .select(
        `
        *,
        admin:admin_id ( contact_email, contact_phone, contact_name, email )
      `
      )
      .order("created_at", { ascending: false });

    return { data, error };
  },

  async adminInitiateContact(userId, entryId, initialMessage) {
    const { data, error } = await supabase.rpc("admin_initiate_contact", {
      target_user_id: userId,
      entry_id: entryId,
      message: initialMessage,
    });

    return { data, error };
  },

  async acceptCrisEntry(requestId) {
    const { data, error } = await supabase.rpc(
      "accept_cris_entry_and_show_contact",
      {
        request_id: requestId,
      }
    );

    if (error) return { data: null, error };
    return { data, error: null };
  },

  async rejectCrisEntry(requestId) {
    const { data, error } = await supabase.rpc("reject_cris_entry", {
      request_id: requestId,
    });

    return { data, error };
  },

  async updateMyContactInfo(email, phone, name, isActive) {
    const { data, error } = await supabase.rpc("admin_update_contact_info", {
      new_email: email,
      new_phone: phone,
      new_name: name,
      is_active: isActive,
    });

    return { data, error };
  },

  async getContactInfo(requestId) {
    const { data, error } = await supabase.rpc("get_contact_info_for_user", {
      request_id: requestId,
    });

    return { data, error };
  },

  async getUserStreak(userId) {
    const { data, error } = await supabase.rpc("get_user_streak", {
      target_user_id: userId,
    });

    return { streak: data, error };
  },
};
