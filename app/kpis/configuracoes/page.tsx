import { loadSettingsAction } from "./actions";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const settings = await loadSettingsAction();
  return <SettingsForm initialSettings={settings} />;
}
