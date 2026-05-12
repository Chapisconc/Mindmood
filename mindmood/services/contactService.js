import { supabase } from './supabase';

export const contactService = {
  /**
   * Usuario solicita contacto con el admin
   */
  async requestContact(userId, message = "") {
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([
        { 
          user_id: userId, 
          initiator: 'user', 
          message: message,
          status: 'pending' 
        }
      ])
      .select();
    
    return { data, error };
  },

  /**
   * Obtener solicitudes del usuario actual
   */
  async getMyRequests() {
    const { data, error } = await supabase
      .from('contact_requests')
      .select(`
        *,
        admin:admin_id ( email )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  /**
   * Admin inicia contacto con un usuario
   */
  async adminInitiateContact(userId, adminId, initialMessage) {
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([
        { 
          user_id: userId, 
          admin_id: adminId, 
          initiator: 'admin', 
          message: initialMessage,
          status: 'pending' 
        }
      ])
      .select();
    
    return { data, error };
  },

  /**
   * Usuario o Admin acepta solicitud de contacto
   */
  async acceptRequest(requestId) {
    const { data, error } = await supabase
      .from('contact_requests')
      .update({ 
        status: 'accepted', 
        admin_response: "¡Excelente! Puedes contactarme en psicologo@holamundo.com o al tel 331549494. Estaré esperando tu mensaje." 
      })
      .eq('id', requestId)
      .select();
    
    return { data, error };
  },

  /**
   * Usuario o Admin rechaza solicitud
   */
  async rejectRequest(requestId) {
    const { data, error } = await supabase
      .from('contact_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select();
    
    return { data, error };
  },

  /**
   * Calcular racha actual del usuario
   */
  async getUserStreak(userId) {
    const { data, error } = await supabase
      .rpc('get_user_streak', { target_user_id: userId });
    
    return { streak: data, error };
  }
};
