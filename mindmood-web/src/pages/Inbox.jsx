import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { contactService } from "../services/contactService";
import ContactInfoModal from "../components/ContactInfoModal";

export default function Inbox() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState({ visible: false, name: "", email: "", phone: "" });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await contactService.getMyRequests();
    if (!error) setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    const { data, error } = await contactService.acceptCrisEntry(requestId);
    if (!error && data) {
      setContactModal({ visible: true, name: data.admin_name || "Contacto Profesional", email: data.admin_email || "", phone: data.admin_phone || "" });
      fetchRequests();
    }
  };

  const handleReject = async (requestId) => {
    if (confirm("¿Estás seguro de que deseas declinar esta invitación?")) {
      await contactService.rejectCrisEntry(requestId);
      fetchRequests();
    }
  };

  const handleAction = (item) => {
    if (item.status === "accepted") {
      const admin = item.admin || {};
      setContactModal({ visible: true, name: admin.contact_name || "Contacto Profesional", email: admin.contact_email || admin.email || "", phone: admin.contact_phone || "" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 pb-24">
        <header className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate("/home")} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black dark:text-white">Bandeja</h1>
        </header>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center mt-20">
            <Bell size={68} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-5 text-lg font-semibold text-slate-400">No tienes mensajes aún.</p>
            <button onClick={async () => { if (user) { await contactService.requestContact(user.id); fetchRequests(); } }}
              className="mt-8 px-8 py-4 rounded-[22px] text-white text-base font-extrabold cursor-pointer border-none bg-indigo-500 hover:bg-indigo-600 transition-colors">
              Solicitar Contacto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 max-w-2xl">
            {requests.map((item, i) => {
              const isAccepted = item.status === "accepted";
              const isPending = item.status === "pending";
              const isRejected = item.status === "rejected";
              const admin = item.admin || {};
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer relative overflow-hidden"
                  onClick={() => handleAction(item)}
                  style={{ borderColor: isAccepted ? "#10B981" : undefined }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black ${isAccepted ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : isPending ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                      {isAccepted ? "ACEPTADO" : isPending ? "PENDIENTE" : "RECHAZADO"}
                    </div>
                    <span className="text-[13px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-base font-extrabold mb-2 dark:text-white">
                    {item.initiator === "admin" ? (admin.contact_name ? `Mensaje de ${admin.contact_name}:` : "Mensaje del Administrador:") : "Tu solicitud:"}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-500 line-clamp-3">{item.message || "Sin mensaje adicional."}</p>

                  {isPending && item.initiator === "admin" && (
                    <div className="flex gap-3 mt-5">
                      <button onClick={(e) => { e.stopPropagation(); handleAccept(item.id); }} className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">Aceptar</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(item.id); }} className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none bg-red-100 dark:bg-red-900/30 text-red-600">Declinar</button>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="mt-5 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                      <p className="text-xs font-extrabold uppercase tracking-[1px] mb-2 text-emerald-600">Contacto</p>
                      {admin.contact_name && <p className="text-base font-bold mb-2 dark:text-white">👤 {admin.contact_name}</p>}
                      {(admin.contact_email || admin.email) && <p className="text-base font-bold mb-2 dark:text-white">📧 {admin.contact_email || admin.email}</p>}
                      {admin.contact_phone && <p className="text-base font-bold mb-3 dark:text-white">📞 {admin.contact_phone}</p>}
                      <div className="flex gap-3 mt-2">
                        {admin.contact_phone && (
                          <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${admin.contact_phone}`, "_self"); }} className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none flex items-center justify-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                            <Phone size={14} /> Llamar
                          </button>
                        )}
                        {(admin.contact_email || admin.email) && (
                          <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${admin.contact_email || admin.email}`, "_self"); }} className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none flex items-center justify-center gap-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                            <Mail size={14} /> Email
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-center">
                      <p className="text-sm font-bold text-red-600">Invitación declinada</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ContactInfoModal visible={contactModal.visible} onClose={() => setContactModal({ visible: false, name: "", email: "", phone: "" })} adminName={contactModal.name} adminEmail={contactModal.email} adminPhone={contactModal.phone} />
    </div>
  );
}
