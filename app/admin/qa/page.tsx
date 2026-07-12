import { getAllQuestionsAdmin } from "@/services/product_question.service";
import { getAdminProductsService } from "@/services/product.service";
import { getProfilesForAdmin } from "@/services/profile.service";
import { QATable } from "@/components/admin/qa/qa-table";

export default async function QAPage() {
  let questions: Awaited<ReturnType<typeof getAllQuestionsAdmin>> = [];
  let products: { id: string; name: string }[] = [];
  let profiles: { id: string; name: string }[] = [];

  try {
    const [questionsData, productsData, profilesData] = await Promise.all([
      getAllQuestionsAdmin(),
      getAdminProductsService(),
      getProfilesForAdmin(),
    ]);
    questions = questionsData;
    products = productsData.map((p) => ({ id: p.id, name: p.name }));
    profiles = profilesData.map((pr) => ({
      id: pr.user_id,
      name: pr.full_name ?? pr.email ?? "Unknown",
    }));
  } catch (e) {
    console.error("Failed to load Q&A data:", e);
  }

  return <QATable questions={questions} products={products} profiles={profiles} />;
}
