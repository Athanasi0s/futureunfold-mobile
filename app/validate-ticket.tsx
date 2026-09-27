import { FeatureGate } from "@/components/feature-gate";
import { ValidateTicketScreen as ValidateTicketScreenInner } from "@/features/ticketing/components/ValidateTicketScreen";

export default function ValidateTicketScreen() {
  return (
    <FeatureGate flag="tickets">
      <ValidateTicketScreenInner />
    </FeatureGate>
  );
}
