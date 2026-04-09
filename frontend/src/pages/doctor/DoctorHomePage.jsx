import { BadgeCheck, ClipboardList, Stethoscope } from "lucide-react";
import PortalLayout from "../../components/common/PortalLayout.jsx";

const doctorHighlights = [
  {
    icon: BadgeCheck,
    title: "Verified clinician access",
    text: "Your account has passed verification and is ready for secure clinical access."
  },
  {
    icon: Stethoscope,
    title: "Clinical workspace",
    text: "Use this area as your secure starting point for schedules, appointments, and care workflows."
  },
  {
    icon: ClipboardList,
    title: "Protected operations",
    text: "Doctor access is protected through approval checks and backend access controls."
  }
];

const DoctorHomePage = () => {
  return (
    <PortalLayout
      eyebrow="Doctor Portal"
      title="Welcome to your doctor workspace"
      description="Manage your clinician access through a secure workspace built for modern care delivery."
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
