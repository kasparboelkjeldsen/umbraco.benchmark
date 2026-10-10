---
name: umbraco-schema
description: Create Umbraco data types, block element types, a Block Grid data type, document types and templates through the umbraco (mcp-dev) MCP server, with the exact call shapes that work. Use when modeling content types, wiring allowed children or templates, or when create-data-type, create-document-type, update-document-type or move-document-type fails.
---

# Umbraco schema through MCP

Every call goes to the `umbraco` server. Arguments are objects and arrays, never strings of JSON. Read each thing back after you create it.

## Built-in data types (same IDs on every default install)

| Data type | ID |
|---|---|
| Textstring | 0cc0eba1-9960-42c9-bf9b-60e150b429ae |
| Textarea | c6bac0dd-4ab9-45b1-8e30-e4b619ee5da3 |
| Rich text | ca90c950-0aff-4e72-b976-a30b1ac57dad |
| Image media picker | ad9f0cf2-bda2-45d5-9ea1-a63cfc873fd3 |
| Date picker | 5046194e-4237-453c-a547-15db3a07c4e1 |

Other data types: `find-data-type` or `get-all-data-types`. Don't create a new Textstring.

## Order

blocks → Block Grid data type → templates → page types → allowed children and templates → read everything back.

## Blocks (element types)

`create-element-type`:
```json
{"name": "Rich Text Block", "alias": "richTextBlock", "icon": "icon-document-html",
 "properties": [{"name": "Text", "alias": "text", "dataTypeId": "ca90c950-0aff-4e72-b976-a30b1ac57dad", "tab": "Content"}]}
```
Every property needs `name`, `alias`, `dataTypeId` and `tab`. A block with no properties is useless.

Filing into a folder (`move-document-type`): the target is an object.
```json
{"id": "<element type id>", "data": {"target": {"id": "<folder id>"}}}
```

## Block Grid data type

`create-data-type`. **editorAlias is `Umbraco.BlockGrid`.** `Umb.PropertyEditorUi.BlockGrid` is the UI alias, and as editorAlias it fails with "property editor was not found".
```json
{"name": "Blog Block Grid", "editorAlias": "Umbraco.BlockGrid", "editorUiAlias": "Umb.PropertyEditorUi.BlockGrid",
 "values": [
   {"alias": "gridColumns", "value": 12},
   {"alias": "blocks", "value": [
     {"contentElementTypeKey": "<block id>", "allowAtRoot": true, "allowInAreas": true}
   ]}
 ]}
```
Read it back with `get-data-type`. Its `blocks` value must list every block, or editors can't add any.

## Templates

`create-template` with `name` and `alias` only. Umbraco writes `Views/<alias>.cshtml`, and you fill in that same file later. Never move, rename or copy it.

## Document types (pages)

`create-document-type`: `name`, `alias`, `icon`, `parentId` (a folder, or leave it out for the root), and `properties` in the same shape as for blocks. A block grid property uses your Block Grid data type's ID.

## Allowed children and templates (`update-document-type`)

This replaces the whole document type. A half object fails validation or wipes properties.

1. `get-document-type-by-id`.
2. Send back **everything you got**, changing only:
   - `allowedTemplates`: `[{"id": "<template id>"}]`
   - `defaultTemplate`: `{"id": "<template id>"}`
   - `allowedDocumentTypes`: `[{"documentType": {"id": "<child type id>"}, "sortOrder": 0}]`

Do this for **the parent of your top page too** (the site root type must allow your front page type). Otherwise `create-page` fails with "Operation not permitted", which means "not an allowed child here".

Allowed children belong to the parent: the front page type allows the post type, and the root type allows the front page type.
