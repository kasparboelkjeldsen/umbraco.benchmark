## Working with Umbraco through MCP

- Build schema and content only through the Umbraco MCP servers. `umbraco` handles data types, document types, templates, media and domains. `umbraco-editor` handles pages, blocks and publishing.
- The route through these tools works. When a call fails, its error message says what to fix. Never decompile, reflect over or grep Umbraco's assemblies or the MCP servers' files. Never read the database or call the Management API yourself. Don't write migrations or uSync files by hand.
- Tool arguments are JSON objects and arrays, never a string that contains JSON.
- If a step still fails after 5 tries, note what failed and move on. Always finish with a short report of what works, what doesn't, and what you checked.
