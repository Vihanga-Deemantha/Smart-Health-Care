import DoctorSearch from "../DoctorSearch.jsx";
import PatientLayout from "../../components/patient/PatientLayout.jsx";

const PatientFindDoctorPage = () => {
  return (
    <PatientLayout
      eyebrow="Find Healthcare Provider"
      title="Search for Doctors"
      description="Find and book appointments with qualified healthcare professionals."
      accent="cyan"
    >
      <DoctorSearch />
    </PatientLayout>
  );
};

export default PatientFindDoctorPage;
