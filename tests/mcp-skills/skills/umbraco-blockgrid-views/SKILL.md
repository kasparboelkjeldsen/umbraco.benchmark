---
name: umbraco-blockgrid-views
description: Write the Razor for Umbraco pages with a Block Grid - page templates, one partial per block, ViewComponents with plain models, rich text rendering and a post listing - using ModelsBuilder types. Use when writing or fixing .cshtml templates, block grid partials or ViewComponents, or when a page shows escaped HTML, Could not render component, or a missing block.
---

# Razor for Block Grid pages

Run `dotnet build` first (with Umbraco stopped) so ModelsBuilder has generated the typed models. Read `Models/ModelsBuilder/*.generated.cs` for the exact class and property names. If the project's AGENTS.md prescribes a pattern, follow it; this skill describes the adapter → plain model → ViewComponent layering.

## Page templates

Fill in `Views/<templateAlias>.cshtml` in place; Umbraco created it with the template. Never move, rename or copy it, and never give it a model type that doesn't exist.

```cshtml
@using Umbraco.Bench.Umbraco.Models
@inherits UmbracoViewPage<BlogFrontPage>
@{
    Layout = null;
    var posts = Model.Children<BlogPost>().ToList();
}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@Model.Title</title>
    <link rel="stylesheet" href="~/dist/site.css" asp-append-version="true" />
</head>
<body>
    @await Html.GetBlockGridHtmlAsync(Model, "body")
    @foreach (var post in posts)
    {
        <a href="@post.Url()">
            @if (post.ListingImage != null) { <img src="@post.ListingImage.GetCropUrl(width: 800, height: 450)" alt="@post.Title" /> }
            <h3>@post.Title</h3>
            <time>@post.PublishDate.ToString("d MMMM yyyy")</time>
            <p>@post.Excerpt</p>
        </a>
    }
</body>
</html>
```

- Without a shared layout, set `Layout = null` and write the whole page, with the stylesheet link.
- Change the namespace in `@using` to your project's ModelsBuilder namespace.

## One partial per block

`Views/Partials/blockgrid/Components/<blockAlias>.cshtml`. The file name is the element type alias. It only maps to a plain model; it has no markup.

```cshtml
@using Umbraco.Cms.Core.Models.Blocks
@using Umbraco.Bench.Umbraco.Models
@using Umbraco.Bench.Umbraco.Models.Blocks
@inherits UmbracoViewPage<BlockGridItem<RichTextBlock>>
@{
    var model = new RichTextModel { Html = Model.Content.Text?.ToHtmlString() ?? "" };
}
@await Component.InvokeAsync("RichText", new { model })
```

- `BlockGridItem<T>` needs `@using Umbraco.Cms.Core.Models.Blocks`.
- Images: `Model.Content.Image?.GetCropUrl(width: 1600)`.

## Plain model and ViewComponent

```csharp
namespace Umbraco.Bench.Umbraco.Models.Blocks;
public sealed record RichTextModel { public string Html { get; init; } = string.Empty; }

public sealed class RichTextViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(RichTextModel model) => View(model);
}
```

- **The class name must end in `ViewComponent`**, or MVC won't find it. `RichTextComponent` fails.
- The view goes in `Views/Shared/Components/RichText/Default.cshtml`: the folder is the class name without `ViewComponent`.

```cshtml
@model Umbraco.Bench.Umbraco.Models.Blocks.RichTextModel
<div class="[&_p]:mt-4 [&_p:first-child]:mt-0">@Html.Raw(Model.Html)</div>
```

## Rich text

- Pass rich text as a string (`.ToHtmlString()`) and print it with `@Html.Raw(...)`. Otherwise the page shows literal `<p>` tags.
- Give paragraphs spacing yourself, as above; Tailwind's reset removes margins.

## Don't

- Don't add CSS for the `umb-block-grid` classes. The default block grid partials already lay the blocks out.
- Don't write custom block renderers or swap out `GetBlockGridHtmlAsync`.
- `Could not render component` means a ViewComponent wasn't found (check the name suffix and the view folder), or it threw an exception. Check the Umbraco log.
