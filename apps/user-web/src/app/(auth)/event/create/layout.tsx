import type { ReactNode } from "react";
import { Wizard } from "./CreateWizardWrapper/CreateWizardWrapper";

export default function CreateEventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <Wizard>{children}</Wizard>;
}
