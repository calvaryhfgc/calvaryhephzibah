# Git hooks

This directory contains git hooks that keep the repo tidy. Currently:

- **pre-commit** — rebuilds `briefings.json` whenever a `media-briefing-*.html` file is staged, so Calvary OS always has an up-to-date index without manual steps.

## One-time setup (per clone)

Git doesn't auto-enable hooks from inside the repo. Run this once after cloning:

```
git config core.hooksPath .githooks
```

That's it. The hooks will fire automatically from then on.

## Disabling temporarily

If you need to commit without running the hooks (rare):

```
git commit --no-verify
```
