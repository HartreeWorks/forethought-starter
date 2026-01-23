import PairwiseComparison from "@/components/PairwiseComparison";

export const metadata = {
  title: "Pairwise Comparison | Prompt Chain Runner",
  description: "Validate ACORN grader by comparing pairs of critiques",
};

export default function PairwisePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Pairwise critique comparison</h1>
        <p className="text-gray-600">
          Compare pairs of critiques to validate the ACORN grader. For each pair,
          decide which critique is better overall.
        </p>
      </div>

      <PairwiseComparison />
    </div>
  );
}
