import { motion } from "framer-motion";
import AuthSidePanel from "./AuthSidePanel.jsx";
import { HeartPulse, Shield } from "lucide-react";

const AuthLayout = ({ title, description, children, footer }) => {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "#071324",
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(47,128,237,0.2) 0px, transparent 55%),
          radial-gradient(ellipse at 80% 20%, rgba(86,204,242,0.12) 0px, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(47,128,237,0.08) 0px, transparent 60%)
        `,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
        }}
      />

      {/* Top accent line */}
      <div
        className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ background: "linear-gradient(90deg, transparent, #2F80ED 30%, #56CCF2 70%, transparent)" }}
      />

      {/* Main grid */}
      <div className="relative min-h-screen flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

            {/* Left: Side Panel */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <AuthSidePanel />
            </motion.div>

            {/* Right: Form card */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            >
              <div
                className="relative w-full rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  border: "1px solid rgba(47,128,237,0.18)",
                  boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(47,128,237,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                {/* Top accent gradient stripe */}
                <div
                  className="h-1 w-full"
                  style={{ background: "linear-gradient(90deg, #2F80ED, #56CCF2, #2F80ED)" }}
                />

                <div className="p-8 sm:p-10">
                  {/* Brand mark */}
                  <div className="flex items-center gap-3 mb-7">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #2F80ED, #56CCF2)",
                        boxShadow: "0 6px 20px rgba(47,128,237,0.35)",
                      }}
                    >
                      <HeartPulse size={19} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="text-base font-black tracking-tight leading-none block" style={{ color: "#0B1F3A" }}>Healio</span>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.35em]" style={{ color: "#2F80ED" }}>Medical Platform</span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div className="mb-7">
                    <h2 className="text-[28px] font-black tracking-tight leading-tight" style={{ color: "#0B1F3A" }}>
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748b" }}>
                      {description}
                    </p>
                  </div>

                  {/* Form content */}
                  {children}

                  {/* Footer */}
                  {footer ? (
                    <div
                      className="mt-7 pt-6 flex items-center justify-between"
                      style={{ borderTop: "1px solid rgba(47,128,237,0.1)" }}
                    >
                      {footer}
                    </div>
                  ) : null}

                  {/* Security badge */}
                  <div className="mt-6 flex items-center justify-center gap-1.5">
                    <Shield size={11} style={{ color: "#27AE60" }} />
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>256-bit SSL · HIPAA Compliant · Secure Platform</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
