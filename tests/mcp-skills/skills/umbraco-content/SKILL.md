---
name: umbraco-content
description: Import media, create Umbraco pages, fill block grid properties, publish and set domains through the umbraco and umbraco-editor MCP servers, with the value shapes that work (media picker, rich text, block grid blocks). Use when creating or editing content, when a page or block value doesn't save, or when publishing fails or is cancelled.
---

# Umbraco content through MCP

Pages, blocks and publishing go through `umbraco-editor`; media and domains go through `umbraco`. Never write block grid JSON by hand: `add-blockgrid-block` builds it, keys included.

## Media (`umbraco`)

1. `create-media-folder` with just `name` (no `parentId`, so it lands at the root). Keep the returned ID.
2. `create-media-multiple`:
```json
{"sourceType": "filePath", "parentId": "<media folder id>",
 "files": [{"name": "Circuit board", "filePath": "C:/code/site/photos/circuit-board.jpg", "mediaTypeName": "Image"}]}
```
`filePath` is absolute, and it must be inside the folders the server allows (`UMBRACO_ALLOWED_MEDIA_PATHS`).

## Pages (`umbraco-editor`)

Find the parent with `list-children` or `search-content`. `create-page`:
```json
{"name": "Why MCP is awesome", "documentTypeId": "<page type id>", "parentId": "<parent page id>",
 "values": [{"alias": "title", "value": "Why MCP is awesome"},
            {"alias": "publishDate", "value": "2026-10-01T09:00:00"}]}
```
"Operation not permitted" means this type isn't an allowed child of the parent. Fix that with update-document-type on the parent's type (see the umbraco-schema skill).

### Value shapes

- **Text, textarea:** a string.
- **Date:** `2026-10-01T09:00:00`.
- **Media picker:** a list with one entry, using a new GUID as `key`:
```json
[{"key": "<new guid>", "mediaKey": "<media id>", "mediaTypeAlias": "Image", "crops": [], "focalPoint": null}]
```
- **Rich text:** an object, not a string:
```json
{"markup": "<p>First paragraph.</p><p>Second.</p>",
 "blocks": {"layout": {}, "contentData": [], "settingsData": [], "expose": []}}
```

## Blocks in a block grid (`add-blockgrid-block`)

One call per block, in reading order:
```json
{"id": "<page id>", "propertyAlias": "body", "contentTypeKey": "<block element type id>",
 "values": [{"alias": "text", "value": {"markup": "<p>...</p>", "blocks": {"layout": {}, "contentData": [], "settingsData": [], "expose": []}}}]}
```
An image block's `image` value is a media picker value, as above. Check the page with `get-page` or `inspect-blocks` afterwards.

## Publishing

- `publish-page` **one page at a time, parent first**: the front page, then each child.
- **Don't use `includeDescendants`.** It asks for an approval that a headless client declines ("Publish cancelled"), and it skips pages that were never published anyway.
- "Parent not published" means you need to publish the parent first.
- Confirm with `get-page` (or `get-publish-status`).

## Domain (`umbraco`)

`put-document-domains` on the site's top page (the front page, not an empty root above it):
```json
{"id": "<front page id>", "data": {"defaultIsoCode": "en-US", "domains": [{"domainName": "/", "isoCode": "en-US"}]}}
```
