# Scoring and selection

## Top 5 selected

{{#each output.top5_details}}
1. **{{id}}** — {{{explanation}}}
{{/each}}

## All scores

| ID | Overall | Strength | Significance | Difficulty |
|----|---------|----------|--------------|------------|
{{#each output.scores}}
| {{id}} | {{overall}} | {{strength}}/10 | {{significance}}/10 | {{difficulty}}/10 |
{{/each}}
