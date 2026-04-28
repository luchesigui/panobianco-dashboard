import { loadSettingsAction, loadStudentBaseGoalsAction, loadConsultorasAction } from "./actions";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [settings, studentBaseGoals, consultoras] = await Promise.all([
    loadSettingsAction(),
    loadStudentBaseGoalsAction(),
    loadConsultorasAction(),
  ]);
  return (
    <SettingsForm
      initialSettings={settings}
      initialStudentBaseGoals={studentBaseGoals}
      initialConsultoras={consultoras}
    />
  );
}
