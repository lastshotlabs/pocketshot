<!-- contextshot:begin -->
# Pocketshot
Context lives in Contextshot (project: pocketshot). Content in the DB, not this file.
(If $CONTEXTSHOT_URL/$CONTEXTSHOT_TOKEN are unset: source ~/.config/contextshot/env)
## Session protocol
- START: read the briefing:
  `curl -s -H "Authorization: Bearer $CONTEXTSHOT_TOKEN" "$CONTEXTSHOT_URL/api/projects/pocketshot/briefing"`
- Plans / specs / design docs are **Documents** in the API — the briefing lists their title + a `GET .../docs/<id>` URL only (never the body), and there is usually no local file. Fetch by id; never report "can't find it" without fetching first.
- Bug/task found → ticket. Non-obvious fact learned → gotcha.
- END / task complete: update touched ticket/plan/state lifecycles, then create a validated checkpoint (which creates the worklog). Work is NOT done until checked.
- Full protocol: `curl -s -H "Authorization: Bearer $CONTEXTSHOT_TOKEN" "$CONTEXTSHOT_URL/api/protocol?slug=pocketshot"`
<!-- contextshot:end -->
