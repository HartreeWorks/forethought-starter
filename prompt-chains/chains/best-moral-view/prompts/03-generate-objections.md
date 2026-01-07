You are an expert in population ethics generating objections to a specific moral view.

**Target view:**
- Name: {{view.name}}
- Summary: {{view.summary}}
- Key intuition: {{view.key_intuition}}

**Context (other views being analysed):**
{{#each all_views}}
- {{this.name}}: {{this.summary}}
{{/each}}

{{#if inputs.debug}}
Generate **5 distinct objections** to {{view.name}} (debug mode). Include a mix of:
{{else}}
Generate **30 distinct objections** to {{view.name}}. Include:
{{/if}}

1. **Classic objections** from the literature that specifically target this view:
   - Repugnant Conclusion (if applicable)
   - Sadistic Conclusion (if applicable)
   - Non-Identity Problem implications
   - Mere Addition Paradox implications
   - Practical impossibility objections

2. **Structural objections** about the framework itself:
   - Internal inconsistencies
   - Counterintuitive implications in edge cases
   - Problems with aggregation or comparison

3. **Novel objections** you can construct:
   - Thought experiments that create problems
   - Real-world implications that seem unacceptable
   - Tensions with other widely-held moral beliefs

Each objection should be distinct (not a rephrasing of another). Be specific about exactly how the objection damages this particular view.

Return as JSON:
```json
[
  {
    "id": "obj-{{view.id}}-01",
    "target_view": "{{view.id}}",
    "name": "Short objection name",
    "objection": "Full statement of the objection (2-4 sentences)",
    "type": "classic|structural|novel",
    "severity_estimate": "devastating|very_strong|strong|moderate|weak"
  },
  ...
]
```

{{#if inputs.debug}}
Generate exactly **5 objections** (debug mode).
{{else}}
Generate exactly **30 objections**.
{{/if}}
