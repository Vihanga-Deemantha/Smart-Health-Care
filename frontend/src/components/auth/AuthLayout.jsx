import { motion } from "framer-motion";
import AuthSidePanel from "./AuthSidePanel.jsx";

const AuthLayout = ({ title, description, children, footer }) => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <AuthSidePanel />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200/80 bg-white/92 p-8 shadow-[0_45px_120px_-45px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Smart Care Health
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 border-t border-slate-200 pt-6">{footer}</div> : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
