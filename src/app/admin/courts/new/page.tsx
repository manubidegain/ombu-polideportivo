import { CourtForm } from '../CourtForm';

export default function NewCourtPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">NUEVA CANCHA</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Crea una nueva cancha en el sistema
        </p>
      </div>

      <CourtForm />
    </div>
  );
}
