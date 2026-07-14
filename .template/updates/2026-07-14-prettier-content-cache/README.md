# Cache Prettier Checks By Content

Use this update when repeated full formatting checks spend noticeable time rechecking unchanged project-owned files.

## Apply

1. Add `--cache --cache-strategy content` to the formatting check command.
2. Store the cache under an ignored, documented local cache path such as `.cache/prettier`.
3. Keep affected-file formatting uncached when it already receives a narrow file list.
4. Do not add remote cache restore/save steps unless measurement shows their overhead is worthwhile.

## Fallback

Remove the cache flags if the target project requires every invocation to be stateless. Do not switch to metadata invalidation merely for a tiny speed gain when branch or restore workflows can change timestamps independently of content.

## Verify

- Remove the cache and run `npm run format:check` once for the cold path.
- Run `npm run format:check` again and confirm the warm path passes.
- Run the target project's full quality gate and local CI workflow.
