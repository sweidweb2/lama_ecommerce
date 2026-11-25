import { getAllQuestionsAdmin } from "@/services/product_question.service";
import { getAdminProductOptionsService } from "@/services/product.service";
import { getProfilesForAdmin } from "@/services/profile.service";
import { QATable } from "@/components/admin/qa/qa-table";

export default async function QAPage() {
  let questions: Awaited<ReturnType<typeof getAllQuestionsAdmin>> = [];
  let products: { id: string; name: string }[] = [];
  let profiles: { id: string; name: string }[] = [];
  let error: string | null = null;

  try {
    const [questionsData, productsData, profilesData] = await Promise.all([
      getAllQuestionsAdmin(),
      getAdminProductOptionsService(),
      getProfilesForAdmin(),
    ]);
    questions = questionsData;
    products = productsData;
    profiles = profilesData.map((pr) => ({
      id: pr.user_id,
      name: pr.full_name ?? pr.email ?? "Unknown",
    }));
  } catch (e) {
    console.error("Failed to load Q&A data:", e);
    error = "Failed to load Q&A. Make sure you are signed in as an admin.";
  }

  return (
    <QATable
      questions={questions}
      products={products}
      profiles={profiles}
      error={error}
    />
  );
}
