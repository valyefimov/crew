# Files

Agents can work with your files — but only in folders you explicitly share.

```bash
crew agent grant Artem ~/code/my-api          # read-only
crew agent grant Sofia ~/notes/blog --rw      # read-write
```

Or in the web UI: open an agent → **Files** → add an absolute path.

## Tools

When at least one folder is shared, the agent gets three tools:

| Tool | Does |
| --- | --- |
| `list_files` | Lists a directory (hidden files and `node_modules` are skipped) |
| `read_file` | Reads a text file (up to 64 KB; binary files are detected) |
| `write_file` | Creates or overwrites a file — only in `rw` folders |

Relative paths resolve against the shared folders, so *"read package.json"* just works.

## Safety

- Every path is resolved with `realpath` **before** the check, so `../` and symlinks can't escape a folder.
- New files are checked through their nearest existing parent.
- Writing requires the folder to be shared as `rw`.

Tool calls are shown in the chat as chips — you always see what the agent touched.
