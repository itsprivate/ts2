# Archive

1. add changed data to `2022-archive-data`
2. build changed data to `2022-dist`, push it.
3. move changed data to archive data.
4. use changed site, to build `graph` datas.
5. use changed data, to build index pages
6. get changed databuild archive data

```bash
site/
  archive/
    2022/
      01/
        en.json
        zh-hans.json
  archive/
    2022/
      en/
        01.json
        02.json
  issues/
    2022/
      en/
        01.json
        02.json
  page/
    1.json
    2.json
  tags/
    test.json
    test2.json
```

```json
[["identifier", "title"]]
```
