export default async (
  page,
  sentence,
  sourceLanguage = "auto",
  targetLanguage,
  { mock = false }
) => {
  if (mock) {
    return {
      result: sentence,
    };
  }
  // max 5000
  if (sentence.length > 4500) {
    sentence = sentence.substring(0, 4500);
  }
  if (!/^(auto|[a-z]{2})$/.test(sourceLanguage))
    throw new Error("INVALID_SOURCE_LANGUAGE");
  if (!/^[a-z]{2}$/.test(targetLanguage))
    throw new Error("INVALID_TARGET_LANGUAGE");
  const sourceLangSelect = "button[dl-test=translator-source-lang-btn]",
    targetLangSelect = "button[dl-test=translator-target-lang-btn]",
    sourceLangMenu = "div[dl-test=translator-source-lang-list]",
    targetLangMenu = "div[dl-test=translator-target-lang-list]",
    sourceLangButton = `button[dl-test=translator-lang-option-${sourceLanguage}]`,
    targetLangButton = `button[dl-test=translator-lang-option-${targetLanguage}]`,
    originalSentenceField = "textarea[dl-test=translator-source-input]",
    targetSentenceField = "textarea[dl-test=translator-target-input]"; /*,
     targetSentencesContainer = '.lmt__translations_as_text'*/

  // click  black
  // await page.screenshot({ path: "data/1.png" });
  // console.log("click");
  await page.waitForSelector(sourceLangSelect, { visible: true });

  await page.click(sourceLangSelect);
  await page.waitForTimeout(500);

  // await page.screenshot({ path: "data/2.png" });

  // const element = await page.$eval(
  //   "[dl-test=translator-source-lang]",
  //   (el) => el.innerHTML
  // );
  // console.log("element", element);
  // console.log("start wait");

  await page.waitForSelector(sourceLangMenu, { visible: true });
  await page.waitForTimeout(500);

  try {
    await page.click(sourceLangButton);
  } catch (_) {
    throw new Error("UNSUPPORTED_SOURCE_LANGUAGE");
  }
  // await page.screenshot({ path: "screens/3.png" });

  await page.waitForSelector(sourceLangMenu, { hidden: true });

  await page.click(targetLangSelect);
  await page.waitForTimeout(1000);

  await page.waitForSelector(targetLangMenu, { visible: true });

  await page.waitForTimeout(1000);
  try {
    await page.click(targetLangButton);
  } catch (_) {
    throw new Error("UNSUPPORTED_TARGET_LANGUAGE");
  }

  // console.log("wait original");

  await page.waitForSelector(originalSentenceField);
  // console.log("start type", sentence);
  await page.$eval(
    originalSentenceField,
    (el, sentence) => (el.value = sentence),
    sentence
  );
  await page.waitForTimeout(2000);

  // await page.keyboard.press("Enter");
  await (await page.$(originalSentenceField)).press("Enter"); // Enter Key

  // await page.type(originalSentenceField, sentence);
  // console.log("here");

  // await page.screenshot({ path: "data/buddy-screenshot2.png" });

  const sentences = [];
  let _res = {};
  page.on("requestfinished", (request) =>
    request
      .response()
      .json()
      .then((res) => {
        if (!res["result"]) return;
        sentences.push(
          ...res["result"]["translations"][0]["beams"].map((item) => ({
            value: item["postprocessed_sentence"],
            confidence: item["totalLogProb"],
          }))
        );

        _res = {
          source: {
            lang: res["result"]["source_lang"].toLowerCase(),
            ...(sourceLanguage === "auto"
              ? {
                  confident: !!res["result"]["source_lang_is_confident"],
                }
              : {}),
            sentence,
          },
          target: {
            lang: res["result"]["target_lang"].toLowerCase(),
            sentences: sentences
              .sort((a, b) => a.confidence - b.confidence)
              .map((item) => item.value),
          },
        };
      })
      .catch(() => {})
  );
  try {
    // //textarea[@dl-test="translator-target-input"]/parent::*/child::*[position()=2]
    await page.waitForXPath(
      '//textarea[@dl-test="translator-target-input"]/parent::*/child::*[position()=2]'
    );
  } catch (e) {
    console.log("can not detect .lmt--active_translation_request");
    console.warn(e);
  }
  await page.waitForXPath(
    '//textarea[@dl-test="translator-target-input"]/parent::*/child::*[position()=2]',
    {
      hidden: true,
      timeout: 90000,
    }
  );

  const result = await page.$eval(targetSentenceField, (el) => el.value);

  _res.result = result;

  const elements = await page.$x(
    "//span[text()='Delete source text']/parent::button"
  );
  await elements[0].click();

  await page.waitForTimeout(2000);

  return _res;
};
