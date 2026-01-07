You are evaluating a moral view in population ethics against the strongest objections and supporting arguments that have been identified.

**View being evaluated:**
- Name: {{view.name}}
- ID: {{view.id}}
- Summary: {{view.summary}}
- Key intuition: {{view.key_intuition}}

**Top 10 Objections (across all views, by overall score):**
{{#each top_objections}}
{{@index}}. **{{this.name}}** (targets: {{this.target_view}}, score: {{this.overall}})
   {{this.reasoning}}
{{/each}}

**Top 10 Supporting Arguments (across all views, by overall score):**
{{#each top_arguments}}
{{@index}}. **{{this.name}}** (supports: {{this.supports_view}}, score: {{this.overall}})
   {{this.reasoning}}
{{/each}}

For **{{view.name}}**, assess:

1. **Objection Impact**: How badly do the relevant top objections damage this view?
   - Which of the top objections apply to this view?
   - How severe is the cumulative damage?
   - Can the view survive these challenges?

2. **Argument Support**: How much do the relevant top arguments support this view?
   - Which of the top arguments apply to this view?
   - How strong is the cumulative support?
   - Do the arguments address the key challenges?

3. **Net Assessment**: Overall defensibility considering both

Return as JSON:
```json
{
  "view_id": "{{view.id}}",
  "view_name": "{{view.name}}",
  "applicable_objections": [
    {"id": "objection-id", "name": "...", "relevance": "direct|indirect|tangential", "impact": 1-100}
  ],
  "applicable_arguments": [
    {"id": "argument-id", "name": "...", "relevance": "direct|indirect|tangential", "support": 1-100}
  ],
  "objection_damage_total": <1-100>,
  "argument_support_total": <1-100>,
  "defensibility_score": <1-100>,
  "assessment_summary": "2-3 paragraph assessment of this view's overall defensibility"
}
```
