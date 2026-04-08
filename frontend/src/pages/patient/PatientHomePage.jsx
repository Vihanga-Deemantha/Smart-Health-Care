import { CalendarDays, HeartPulse, ShieldCheck } from "lucide-react";
import PortalLayout from "../../components/common/PortalLayout.jsx";

const patientHighlights = [
  {
    icon: HeartPulse,
    title: "Account ready",
    text: "Your patient identity is active and ready for the next healthcare features we plug into this platform."
  },
  {
    icon: ShieldCheck,
    title: "Secure session",
    text: "You are signed in through the gateway with protected routing, refresh-token handling, and role-based access."
  },
  {
    icon: CalendarDays,
    title: "Prepared for appointments",
    text: "This area is a clean base for upcoming patient modules like appointments, consultations, and records."
  }
];

const PatientHomePage = () => {
  return (
    <PortalLayout
      eyebrow="Patient Portal"
      title="Welcome to your patient workspace"
      description="This is your secure patient landing page after authentication. It gives you a safe entry point before appointments, records, and other care workflows are added."
      accent="cyan"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {patientHighlights.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-[24px] border border-white/8 bg-white/5 p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Icon size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
};

export default PatientHomePage;
