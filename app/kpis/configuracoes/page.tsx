import {
  loadSettingsAction,
  loadStudentBaseGoalsAction,
  loadConsultorasAction,
  loadInactiveConsultorasAction,
} from "./actions";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [settings, studentBaseGoals, consultoras, inactiveConsultoras] = await Promise.all([
    loadSettingsAction(),
    loadStudentBaseGoalsAction(),
    loadConsultorasAction(),
    loadInactiveConsultorasAction(),
  ]);
  return (
    <SettingsForm
      initialSettings={settings}
      initialStudentBaseGoals={studentBaseGoals}
      initialConsultoras={consultoras}
      initialInactiveConsultoras={inactiveConsultoras}
    />
  );
}
