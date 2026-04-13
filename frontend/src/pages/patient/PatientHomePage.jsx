import { CalendarDays, HeartPulse, ShieldCheck } from "lucide-react";
<<<<<<< Updated upstream
import PortalLayout from "../../components/common/PortalLayout.jsx";
=======
import PatientLayout from "../../components/patient/PatientLayout.jsx";
>>>>>>> Stashed changes

const patientHighlights = [
  {
    icon: HeartPulse,
    title: "Account active",
    text: "Your patient account is verified and ready for secure access to care services."
  },
  {
    icon: ShieldCheck,
    title: "Secure session",
    text: "Your session is protected through the gateway and platform access controls."
  },
  {
    icon: CalendarDays,
    title: "Ready for care",
    text: "This workspace is prepared for appointments, records, and patient-facing services."
  }
];

const PatientHomePage = () => {
  return (
<<<<<<< Updated upstream
    <PortalLayout
=======
    <PatientLayout
>>>>>>> Stashed changes
      eyebrow="Patient Portal"
      title="Welcome to your patient workspace"
      description="Access your patient account through a secure, streamlined care workspace."
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
<<<<<<< Updated upstream
    </PortalLayout>
=======
    </PatientLayout>
>>>>>>> Stashed changes
  );
};

export default PatientHomePage;
