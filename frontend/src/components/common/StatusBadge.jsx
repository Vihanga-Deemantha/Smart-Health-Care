const styles = {
  ACTIVE: "bg-[#ECF8F1] text-[#1F7A46] ring-1 ring-[#CBEED8]",
  SUSPENDED: "bg-[#FDEEEE] text-[#C0392B] ring-1 ring-[#F5C6C1]",
  PENDING: "bg-[#FEF3E8] text-[#C97A2B] ring-1 ring-[#F7D7B5]",
  LOCKED: "bg-[#FFF0E2] text-[#D46A1F] ring-1 ring-[#F7D7B5]",
  APPROVED: "bg-[#ECF8F1] text-[#1F7A46] ring-1 ring-[#CBEED8]",
  CHANGES_REQUESTED: "bg-[#EEF7FF] text-[#2F80ED] ring-1 ring-[#CFE2FF]",
  REJECTED: "bg-[#FDEEEE] text-[#C0392B] ring-1 ring-[#F5C6C1]",
  PATIENT: "bg-[#EEF7FF] text-[#2F80ED] ring-1 ring-[#CFE2FF]",
  DOCTOR: "bg-[#EAFBFF] text-[#1F8FB3] ring-1 ring-[#CDEFF8]",
  ADMIN: "bg-[#F4EEFF] text-[#7B61C8] ring-1 ring-[#DED0FF]",
  SUPER_ADMIN: "bg-[#EEF4FF] text-[#1D4ED8] ring-1 ring-[#C7D7FE]"
};

const StatusBadge = ({ value }) => {
  const label = value || "UNKNOWN";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[label] || "bg-[#F3F6FA] text-[#5C708A] ring-1 ring-[#E0E7EF]"}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
