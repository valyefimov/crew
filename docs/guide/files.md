# Files

Agents can work with your files, but only in folders you share with them.

```bash
crew agent grant Artem ~/code/my-api          # read-only
crew agent grant Sofia ~/notes/blog --rw      # read and write
```

In the web UI, open an agent, go to Files and add an absolute path.

## Tools

Once at least one folder is shared, the agent gets three tools:

| Tool | What it does |
| --- | --- |
| `list_files` | Lists a directory. Hidden files and `node_modules` are skipped. |
| `read_file` | Reads a text file, up to 64 KB. Binary files are detected and not read. |
| `write_file` | Creates or overwrites a file. Only works in `rw` folders. |

Relative paths resolve against the shared folders, so "read package.json" works as you'd expect.

## Safety

Every path goes through `realpath` before the permission check, so `../` and symlinks can't take an agent outside a shared folder. A new file is checked through its nearest existing parent. Writing needs the folder to be shared as `rw`.

Tool calls appear in the chat as small chips, so you can always see what the agent touched.
