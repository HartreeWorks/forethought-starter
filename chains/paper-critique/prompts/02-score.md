Below is a list of potential critiques of a philosophy paper. Evaluate each critique on:

* Strength: Does it identify a genuine weakness?
* Significance: Would addressing it require substantial revision?
* Difficulty: How hard would it be for the author to adequately respond?

Assign 0-10 for each dimension above and compute an overall score (0-100). Rank all critiques and identify the top 5 most compelling ones. For each of the top 5, explain in 2-3 sentences why it ranks highly.

Return STRICT JSON object only (no prose, no code fences) with the following structure:
{
  "scores": [{
    "id": "string",
    "overall": number,
    "strength": number,
    "significance": number,
    "difficulty": number
  }],
  "top5": ["id1", "id2", "id3", "id4", "id5"],
  "top5_details": [{"id": "string", "explanation": "string"}]
}

[LIST OF CRITIQUES FROM STAGE 1]
{{json critiques}}

[ORIGINAL PAPER]

{{paper}}
