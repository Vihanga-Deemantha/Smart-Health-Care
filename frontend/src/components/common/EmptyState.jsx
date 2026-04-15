import { Inbox } from "lucide-react";

const EmptyState = ({ title, description, action = null }) => {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-10 text-center shadow-[0_30px_70px_-35px_rgba(15,23,42,0.9)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800 text-cyan-300">
        <Inbox size={28} />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
