You are producing the final ranking and synthesis of the moral views analysis.

**Views evaluated:**
{{#each views}}
- **{{this.name}}** ({{this.id}}): {{this.summary}}
{{/each}}

**View Evaluations:**
{{#each evaluations}}
## {{this.view_name}}
- Defensibility score: {{this.defensibility_score}}
- Objection damage: {{this.objection_damage_total}}
- Argument support: {{this.argument_support_total}}
- Assessment: {{this.assessment_summary}}

{{/each}}

Produce a final ranking and synthesis:

1. **Ranked List**: Order the views from most to least defensible, with reasoning for each placement.

2. **Synthesis**: Write 3-4 paragraphs that:
   - Identify which views emerged as most defensible and why
   - Note surprising findings or views that performed better/worse than expected
   - Discuss what the analysis reveals about the state of population ethics
   - Highlight key unresolved tensions or open questions

3. **Uncertainties**: Note important caveats and limitations of this analysis.

4. **Recommendations**: What should researchers focus on next?

Return as JSON:
```json
{
  "ranked_views": [
    {
      "rank": 1,
      "view_id": "...",
      "view_name": "...",
      "defensibility_score": <1-100>,
      "ranking_rationale": "Why this view ranks here..."
    },
    ...
  ],
  "synthesis": "3-4 paragraph synthesis...",
  "uncertainties": [
    "Important uncertainty 1...",
    "Important uncertainty 2...",
    ...
  ],
  "recommendations": [
    "Research recommendation 1...",
    "Research recommendation 2...",
    ...
  ]
}
```
