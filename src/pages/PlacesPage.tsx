
import { useFamily } from "../contexts/FamilyContext";
import { PlacesLayout } from "../components/places/PlacesLayout";
import { PageLoader } from "../components/ui/LoadingSpinner";

export function PlacesPage() {
  const { currentFamily, isLoading } = useFamily();

  if (isLoading) return <PageLoader />;
  if (!currentFamily) return <div>No family selected</div>;

  return <PlacesLayout familyId={currentFamily._id} />;
}
