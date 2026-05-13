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
    else if (import.meta.env.DEV) console.error("[Inbox] Fetch Error:", error);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    const { data, error } = await contactService.acceptCrisEntry(requestId);
    if (!error && data) {
      setContactModal({
        visible: true,
        name: data.admin_name || "Contacto Profesional",
        email: data.admin_email || "",
        phone: data.admin_phone || "",
      });
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
      setContactModal({
        visible: true,
        name: admin.contact_name || "Contacto Profesional",
        email: admin.contact_email || admin.email || "",
        phone: admin.contact_phone || "",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeStyles.background }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${themeStyles.accent}40`, borderTopColor: themeStyles.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeStyles.background }}>
      <div className="max-w-lg mx-auto pb-16">
        <button
          onClick={() => navigate("/home")}
          className="bg-transparent border-none cursor-pointer px-6 pt-8 pb-2 flex items-center gap-2"
        >
          <ArrowLeft size={24} color={themeStyles.secondaryText} />
          <span className="text-sm font-bold" style={{ color: themeStyles.secondaryText }}>Volver</span>
        </button>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center mt-20 px-6">
            <Bell size={68} color={themeStyles.glow} />
            <p className="mt-5 text-[17px] font-semibold text-center" style={{ color: themeStyles.secondaryText }}>
              No tienes mensajes aún.
            </p>
            <button
              onClick={async () => {
                if (user) {
                  await contactService.requestContact(user.id);
                  fetchRequests();
                }
              }}
              className="mt-8 px-8 py-4 rounded-[22px] text-white text-base font-extrabold cursor-pointer border-none"
              style={{ backgroundColor: themeStyles.accent }}
            >
              Solicitar Contacto
            </button>
          </div>
        ) : (
          <div className="px-5 pt-4">
            {requests.map((item, i) => {
              const isAccepted = item.status === "accepted";
              const isPending = item.status === "pending";
              const isRejected = item.status === "rejected";
              const admin = item.admin || {};

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="p-5 rounded-[26px] mb-4 border-[1.5px] cursor-pointer"
                  style={{
                    backgroundColor: themeStyles.card,
                    borderColor: isAccepted ? "#10B981" : themeStyles.border,
                  }}
                  onClick={() => handleAction(item)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black"
                      style={{
                        backgroundColor: isAccepted ? "#10B98120" : isPending ? "#F59E0B20" : "#EF444420",
                        color: isAccepted ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                      }}
                    >
                      {isAccepted ? "ACEPTADO" : isPending ? "PENDIENTE" : "RECHAZADO"}
                    </div>
                    <span className="text-[13px]" style={{ color: themeStyles.secondaryText }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[15px] font-extrabold mb-1.5" style={{ color: themeStyles.text }}>
                    {item.initiator === "admin"
                      ? (admin.contact_name ? `Mensaje de ${admin.contact_name}:` : "Mensaje del Administrador:")
                      : "Tu solicitud:"}
                  </p>
                  <p className="text-[15px] leading-[22px] line-clamp-3" style={{ color: themeStyles.secondaryText }}>
                    {item.message || "Sin mensaje adicional."}
                  </p>

                  {isPending && item.initiator === "admin" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAccept(item.id); }}
                        className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none"
                        style={{ backgroundColor: "#10B98120", color: "#10B981" }}
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                        className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none"
                        style={{ backgroundColor: "#EF444420", color: "#EF4444" }}
                      >
                        Declinar
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <div
                      className="mt-4 p-5 rounded-xl border"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "#10B981" }}
                    >
                      <p className="text-xs font-extrabold uppercase tracking-[1px] mb-1" style={{ color: "#10B981" }}>
                        Contacto
                      </p>
                      {admin.contact_name && (
                        <p className="text-base font-bold mb-3" style={{ color: themeStyles.text }}>👤 {admin.contact_name}</p>
                      )}
                      {(admin.contact_email || admin.email) && (
                        <p className="text-base font-bold mb-3" style={{ color: themeStyles.text }}>
                          📧 {admin.contact_email || admin.email}
                        </p>
                      )}
                      {admin.contact_phone && (
                        <p className="text-base font-bold mb-3" style={{ color: themeStyles.text }}>📞 {admin.contact_phone}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {admin.contact_phone && (
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(`tel:${admin.contact_phone}`, "_self"); }}
                            className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none flex items-center justify-center gap-1"
                            style={{ backgroundColor: "#10B98120", color: "#10B981" }}
                          >
                            <Phone size={14} /> Llamar
                          </button>
                        )}
                        {(admin.contact_email || admin.email) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(`mailto:${admin.contact_email || admin.email}?subject=MindMood Contacto`, "_self"); }}
                            className="flex-1 py-3 rounded-xl text-sm font-extrabold cursor-pointer border-none flex items-center justify-center gap-1"
                            style={{ backgroundColor: "#8B5CF620", color: "#8B5CF6" }}
                          >
                            <Mail size={14} /> Email
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div
                      className="mt-4 p-4 rounded-xl border text-center"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.06)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                    >
                      <p className="text-[15px] font-bold" style={{ color: "#EF4444" }}>Invitación declinada</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ContactInfoModal
        visible={contactModal.visible}
        onClose={() => setContactModal({ visible: false, name: "", email: "", phone: "" })}
        adminName={contactModal.name}
        adminEmail={contactModal.email}
        adminPhone={contactModal.phone}
      />
    </div>
  );
}
