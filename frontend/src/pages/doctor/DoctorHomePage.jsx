import { BadgeCheck, ClipboardList, Stethoscope } from "lucide-react";
import PortalLayout from "../../components/common/PortalLayout.jsx";

const doctorHighlights = [
  {
    icon: BadgeCheck,
    title: "Doctor access approved",
    text: "Your account passed email verification and admin review, so you can safely enter the professional side of the system."
  },
  {
    icon: Stethoscope,
    title: "Clinical identity ready",
    text: "This page is your doctor landing space and a stable starting point for schedules, appointments, and patient-facing tools."
  },
  {
    icon: ClipboardList,
    title: "Operationally prepared",
    text: "The platform already protects doctor access with role-aware routing, approval checks, and backend verification rules."
  }
];

const DoctorHomePage = () => {
  return (
    <PortalLayout
      eyebrow="Doctor Portal"
      title="Welcome to your doctor workspace"
      description="You are now inside the doctor side of the platform. This page gives approved clinicians a proper home instead of dropping them back onto the public landing flow."
      accent="blue"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {doctorHighlights.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-[24px] border border-white/8 bg-white/5 p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
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

export default DoctorHomePage;
