# Core Concepts

## Standard

- [json-ld internationalization](https://www.w3.org/TR/json-ld/#string-internationalization)
- [schema org validator](https://validator.schema.org/)
- https://github.com/Sylius/Sylius/issues/11412
- https://json-ld.org/playground/
- https://github.com/google/schema-dts
- https://schema.org/InteractionCounter
- https://www.w3.org/International/articles/bcp47/
- https://jvilk.com/MakeTypes/
- https://search.google.com/test/rich-results
- https://console.scaleway.com/object-storage/buckets/nl-ams/b-posts/

## Project Structure

simple:

```bash
data/
  site1/
      1234321432-xxxxxx.json
      1234321432-xxxxxx.json
changed/
raw/

```

```bash

source --scrach--> raw

raw --translate--> changed


changed ----> archive --> 增量构建--> site-dist-data  ---->  ---> archive-dist --> site-dist

or

全量构建 --> site-dist-data ----> site-dist archive-dist
archive

```

```bash
current-data/
  apps/
    site1/
      config.toml
      sources
        source-from-reddit.yml
    site2/
  changed/
    2021/
  archive/
    2021/
      11/
        16/
          site1/
            ArticleNews-twitter-en-2021-11-16-slug.json
  raw/
    2021/
      11/
        16/
          site1/
            post-slug.json


2021-data/
  data/
    2021/

2020-data/
  data/
    2020/
site2-data/
  data/
    tags/
    issues/


site2-dist/
  index.html
  page/
    2/
      index.html
  page/
    20/
      index.html
  tags/
    tag1/
      index.html
    tag2/
      index.html
site3-dist/
2021-11-dist/

2021-10-dist/
2021-09-dist/
  site2/
    12/
      post/
        activity-reddit-slug1/
          index.html

```

## File Structure

```bash
data/
  tags/
    site2/
      # max 100
      tag-slug1.json
      # max 100
      tag-slug2.json
  confis/
    config-site2.json
  2021/
    site2/
      11/
        12/
          post/
            activity-reddit-slug1/
              data.json
          issue/
            issue-slug1.json

```

### tag

```json
{
  "name": "English Name",
  "locales": {
    "zh": "China Name"
  },
  "updated_at": "2021",
  "created_at": "2021",
  "indexes": ["/2021/11/12/posts/activity-reddit-slug1/", "/2021/site2"],
  "map": {
    "/2021/11/12/posts/activity-reddit-slug1/": {
      "title": "title"
    }
  }
}
```

## URL Structure

```bash
# Detail
/2021/11/12/post-reddit-slug1/
/2022/11/13/post-reddit-slug2/

# Pages
/page/2/

# Tags

/tags/tag-slug1/

# Issues

/2021/11/13/issue/issue-site-1/


2021-11.buzzing.cc/site2/13/post/reddit/slug1/
```

24*365*20

[
[url,name],
[url,name]
]

```bash
current/
  issues/
    site1/
      en.json
    site2/
      en.json
  archives/
    site1/
      en.json
      zh.json
  posts/
    2021/
      11/
        12/
          site1/
            post-slug.json
changed/
  posts/
    2021/
      11/
        12/
          site1/
            post-slug.json
```

changed -> build -> archive data

```bash
2020/
    posts/
      2021/
        11/
          16/
            site1/
              post-slug.json
    issues/
      2021/
        01/
          site1/
            en.json
            zh-ZH.json
          site2/
            en.json
        02/
    archives/
      2021/
        01/
          site/
            en.json
            zh-ZH.json
archive-dist/
  posts/
    2021/


```
