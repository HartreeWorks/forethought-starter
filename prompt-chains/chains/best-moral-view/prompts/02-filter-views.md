You are an expert in population ethics. Below are {{views.length}} moral views in population ethics:

{{#each views}}
## {{this.name}} ({{this.id}})
{{this.summary}}
*Key intuition:* {{this.key_intuition}}

{{/each}}

{{#if inputs.debug}}
Select the **3 most interesting and defensible views** to analyse in depth (debug mode). Choose views that:
{{else}}
Select the **5 most interesting and defensible views** to analyse in depth. Choose views that:
{{/if}}
1. Represent diverse approaches (don't pick 5 variations of the same view)
2. Have genuine philosophical merit and are taken seriously in the literature
3. Have enough substance to generate meaningful objections and supporting arguments
4. Span the spectrum from established to more novel positions

For each selected view, explain briefly why you selected it.

Return as JSON:
```json
[
  {
    "id": "view-id-from-original-list",
    "name": "View Name",
    "summary": "Original summary...",
    "key_intuition": "Original key intuition...",
    "selection_reason": "Why this view was selected for deeper analysis..."
  },
  ...
]
```

{{#if inputs.debug}}
Return exactly **3 views** (debug mode).
{{else}}
Return exactly **5 views**.
{{/if}}
