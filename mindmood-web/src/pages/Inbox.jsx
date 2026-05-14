/* ------------------------------------------------------------------ */
/* Inbox.jsx — Bandeja de entrada del usuario                         */
/* Ruta: /inbox                                                       */
/* Propósito: Mostrar solicitudes de contacto del admin,              */
/* permitir aceptar/rechazar y ver info de contacto profesional.      */
/* Requiere autenticación.                                            */
/* ------------------------------------------------------------------ */

// React hooks para estado, efectos y memoización de callbacks
import { useState, useEffect, useCallback } from "react";
// Framer Motion para animaciones de lista y carga
import { motion } from "framer-motion";
// Iconos de interfaz: campana, recargar, usuario, teléfono, check, cruz
import { Bell, RefreshCw, User, Phone, Mail, Check, X } from "lucide-react";
// Hook de navegación para redirecciones
import { useNavigate } from "react-router-dom";
// Hook de autenticación (user)
import { useAuth } from "../hooks/useAuth";
// Servicio de contacto: obtener solicitudes, aceptar, rechazar
import { contactService } from "../services/contactService";
// Modal que muestra datos del contacto profesional (nombre, email, teléfono)
import ContactInfoModal from "../components/ContactInfoModal";
import BackgroundDecor from "../components/BackgroundDecor";

/* Componente principal de la bandeja de entrada */
export default function Inbox() {
  /* Hook de navegación (no usado directamente en este componente) */
  const navigate = useNavigate();
  /* Usuario autenticado actual */
  const { user } = useAuth();
  /* Lista de solicitudes de contacto del admin */
  const [requests, setRequests] = useState([]);
  /* Indicador de carga inicial */
  const [loading, setLoading] = useState(true);
  /* Estado del modal de información de contacto */
  const [contactModal, setContactModal] = useState({ visible: false, name: "", email: "", phone: "" });

  /* Obtiene las solicitudes de contacto del usuario desde Supabase */
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await contactService.getMyRequests();
    if (!error) setRequests(data || []);
    setLoading(false);
  }, []);

  /* Efecto inicial: carga las solicitudes al montar el componente */
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  /* Acepta una solicitud de contacto y muestra el modal con los datos del admin */
  const handleAccept = async (requestId) => {
    const { data, error } = await contactService.acceptCrisEntry(requestId);
    if (!error && data) {
      setContactModal({ visible: true, name: data.admin_name || "Contacto Profesional", email: data.admin_email || "", phone: data.admin_phone || "" });
      fetchRequests();
    }
  };

  /* Rechaza una solicitud de contacto tras confirmación del usuario */
  const handleReject = async (requestId) => {
    if (confirm("¿Estás seguro de que deseas declinar esta invitación?")) {
      await contactService.rejectCrisEntry(requestId);
      fetchRequests();
    }
  };

  /* Muestra el modal de contacto si la solicitud ya fue aceptada */
  const handleShowContact = async (item) => {
    if (item.status !== "accepted") return;
    const { data } = await contactService.getContactInfo(item.id);
    if (data) setContactModal({ visible: true, name: data.admin_name || "Contacto Profesional", email: data.admin_email || "", phone: data.admin_phone || "" });
  };

  {/* Spinner de carga mientras se obtienen las solicitudes */}
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {/*
        Contenedor principal.
        pb-24 reserva espacio para la barra de navegación inferior.
      */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        {/* Encabezado: título y contador de mensajes */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white">Bandeja</h1>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1">{requests.length > 0 ? `${requests.length} mensaje${requests.length !== 1 ? "s" : ""}` : ""}</p>
          </div>
          {/* Botón para recargar solicitudes manualmente */}
          <button onClick={fetchRequests} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform cursor-pointer">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Estado vacío: no hay mensajes */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-bold text-slate-400 dark:text-slate-500">No tienes mensajes aún.</p>
          </div>
        ) : (
          /* Lista de solicitudes de contacto */
          <div className="space-y-3">
            {requests.map((item, i) => {
              /* Determina estado visual según status de la solicitud */
              const isAccepted = item.status === "accepted";
              const isPending = item.status === "pending";
              const isRejected = item.status === "rejected";
              const statusColor = isAccepted ? "#10B981" : isPending ? "#F59E0B" : "#EF4444";
              const statusLabel = isAccepted ? "ACEPTADO" : isPending ? "PENDIENTE" : "RECHAZADO";

              return (
                /* Tarjeta individual con borde izquierdo de color según estado */
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="group bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                  style={{ borderLeft: `3px solid ${statusColor}` }}
                >
                  <div className="p-5">
                    {/* Cabecera: icono de estado, quién inició, fecha, badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                          {isAccepted ? "✓" : isPending ? "⏳" : "✗"}
                        </div>
                        <div>
                          <span className="text-sm font-black dark:text-white">{item.initiator === "admin" ? "Mensaje del Administrador:" : "Tu solicitud:"}</span>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: `${statusColor}12`, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Cuerpo del mensaje (texto opcional) */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {item.message || "Sin mensaje adicional."}
                    </p>

                    {/* Solicitud entrante del admin: botones Aceptar / Declinar */}
                    {isPending && item.initiator === "admin" && (
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleAccept(item.id); }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none transition-all hover:scale-[1.02]"
                          style={{ backgroundColor: "#10B981", color: "#fff" }}>
                          <Check className="w-3.5 h-3.5" /> Aceptar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none transition-all hover:scale-[1.02]"
                          style={{ backgroundColor: "#EF444415", color: "#EF4444" }}>
                          <X className="w-3.5 h-3.5" /> Declinar
                        </button>
                      </div>
                    )}

                    {/* Solicitud aceptada: botón para ver info del contacto profesional */}
                    {isAccepted && (
                      <button onClick={() => handleShowContact(item)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: "#10B98115", color: "#10B981" }}>
                        <User className="w-3.5 h-3.5" /> Ver información de contacto
                      </button>
                    )}

                    {/* Solicitud rechazada: mensaje informativo */}
                    {isRejected && (
                      <p className="text-xs font-bold text-slate-400 italic">Invitación declinada</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de contacto profesional (nombre, email, teléfono) */}
      <ContactInfoModal visible={contactModal.visible} onClose={() => setContactModal({ visible: false, name: "", email: "", phone: "" })} adminName={contactModal.name} adminEmail={contactModal.email} adminPhone={contactModal.phone} />
    </div>
  );
}
