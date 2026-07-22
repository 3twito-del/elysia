# ביקורת שיפור חנות Elysia

תאריך בדיקה: 22 ביולי 2026  
סטטוס: מסמך החלטה בלבד. הממצאים בפרק הביקורת **לא יושמו** במסגרת השדרוג הנוכחי.

## מחקר טיפוגרפיה

המדגם מכוון ואינו מחקר סטטיסטי. נבדקו CSS ו־HTML חיים של 15 אתרים בעברית ושל 15 מותגי אופנה ותכשיטים באנגלית. קובצי CSS עם fingerprint עשויים להשתנות בפריסה הבאה; לכן לצד קישור ישיר לגיליון הסגנון מצוין גם שם האתר. טעינת משפחה בקובץ אינה מוכיחה שהיא מופעלת בכל תבנית, ובאתרים שחסמו סריקה אוטומטית ההסקה הוגבלה למקור הציבורי הנגיש.

### אתרים בעברית

| אתר        | ראיית CSS ממקור ראשון                                                                                               | ממצא                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Terminal X | [main.css](https://www.terminalx.com/assets/main.046586ce9e2f5de1182b.css)                                          | Heebo כממשק sans מרכזי             |
| שופרסל     | [vendor.css](https://www.shufersal.co.il/online/_ui/responsive/theme-miglog/css/vendorm4c7b5e.css)                  | Open Sans Hebrew                   |
| סופר־פארם  | [bootstrap.light.min.css](https://shop.super-pharm.co.il/_ui/responsive/common/css/bootstrap.light.min.css)         | Open Sans                          |
| Castro     | [all.css](https://www.castro.com/pub/static/version1773042109/frontend/Castro/Theme/he_IL/css/all.css)              | Heebo לצד Open Sans                |
| Golf       | [all.css](https://www.golf-il.co.il/pub/static/version1760863101/frontend/Golf/Theme/he_IL/css/all.css)             | Rubik לממשק; display לטיני נקודתי  |
| Ivory      | [sticky-header CSS](https://www.ivory.co.il/css/sticky-header-global.min.css?lm=00dda93118ab3e575cfcf81147690a6e)   | Heebo                              |
| Fox        | [theme.css](https://fox.co.il/cdn/shop/t/101/assets/theme.css?v=83336228258357536511781690936)                      | ערימות sans ייעודיות לגוף ולכותרות |
| ynet       | [ynet.css](https://ynet-pic1.yit.co.il/Common/frontend/site/prod/ynet.6ce4b22e4eaaeaed64eb0fe8905a54f4.css)         | Moses/Narkis לכותרות ותוכן         |
| הארץ       | [Next CSS](https://www.haaretz.co.il/v2/htz-bucket/_next/static/css/c70dbeeb69295c3c.css)                           | Open Sans ומרכיב serif מערכתי      |
| עזריאלי    | [Assistant CSS](https://fonts.googleapis.com/css2?family=Assistant:wght@200..800&display=swap)                      | Assistant                          |
| Delta      | [all.css](https://www.delta.co.il/pub/static/version1782704436/frontend/Idus/Delta/he_IL/css/all.css)               | Assistant ו־Noto                   |
| mako       | [Next CSS](https://www.mako.co.il/_next/static/css/076e86d9b1cdaf26.css)                                            | Yonit ו־Almoni קנייניים            |
| ישראל היום | [Next CSS](https://www.israelhayom.co.il/_next/static/css/6142625821e7cfd3a4db.css)                                 | Noto Sans Hebrew ו־IBM Plex        |
| מעריב      | [Next CSS](https://www.maariv.co.il/_next/static/css/3d4c5e679be4237f.css)                                          | Open Sans                          |
| ACE        | [merged CSS](https://www.ace.co.il/static/version1783320812/_cache/merged/763726fae862c890195d943e96bd70ad.min.css) | Open Sans                          |

### אתרי אופנה ותכשיטים באנגלית

| אתר             | ראיית CSS ממקור ראשון                                                                                                                     | ממצא                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Blue Nile       | [brand CSS](https://ecommo--ion.bluenile.com/static-content-bn/BRAND_PAGES-cmsTemplates-splash-Diamonds.b1059e06df9c95f5270e.css)         | sans לממשק עם serif לכותרות     |
| Ana Luisa       | [styles.css](https://www.analuisa.com/styles.87c93c8b1132ad144ad0.css)                                                                    | Mulish עם display serif         |
| Kendra Scott    | [official Typekit CSS](https://use.typekit.net/igi7ndd.css)                                                                               | Inter/Brandon עם Cormorant      |
| David Yurman    | [global.css](https://www.davidyurman.com/on/demandware.static/Sites-davidyurman-Site/-/en_US/v1784720158441/css/global.css)               | Proxima Nova ו־Sweet Sans       |
| VRAI            | [Next CSS](https://www.vrai.com/_next/static/css/7adf00db2c8e803e.css?dpl=dpl_4KCd3iUgkYEvtkHTBhrBz3uqcj4d)                               | משפחות מותג קנייניות            |
| Catbird         | [merged CSS](https://www.catbirdnyc.com/static/version1784010254/_cache/merged/bf9937241b12e12c447c51979235719f.min.css)                  | TT Fors עם Denton               |
| Gorjana         | [official Typekit CSS](https://use.typekit.net/org6wyq.css)                                                                               | Futura עם Freight               |
| Gap             | [commerce CSS](https://www.gap.com/static_content/onesitecategory/components/mfe/_next/static/chunks/1pun5yed9e92v.css)                   | sans יחיד לממשק ולמסחר          |
| Banana Republic | [commerce CSS](https://bananarepublic.gap.com/static_content/onesitecategory/components/mfe/_next/static/chunks/1-g042mkvm991.css)        | Lynstone עם Didot               |
| Chopard         | [global.css](https://www.chopard.com/on/demandware.static/Sites-chopard-Site/-/en_BI/v1784744225018/css/global.css)                       | Helvetica עם Walbaum            |
| De Beers        | [official Typekit CSS](https://use.typekit.net/lkc5rtx.css)                                                                               | Futura עם Didot/Caslon          |
| Reformation     | [global-atf.css](https://www.thereformation.com/on/demandware.static/Sites-reformation-us-Site/-/en_US/v1784718509147/css/global-atf.css) | Newtime עם TimesNow             |
| Mango           | [Next CSS](https://shop.mango.com/assets-site-shop/_next/static/chunks/0if3ktw1opjzb.css)                                                 | sans למסחר ו־Heritage לקמפיינים |
| PDPAOLA         | [app.css](https://www.pdpaola.com/cdn/shop/t/461/assets/app.css?v=56948544722658352061784285793)                                          | Assistant עם Playfair           |
| Shopbop         | [stylesheet](https://m.media-amazon.com/images/X/IAwF/M/vIAwFBlSNey7s2L.css)                                                              | GT America עם Financier         |

המסקנה: בממשק עברי עקבי עדיף sans עברי אחד במשקלים שונים; במותגי אופנה מקובל להוסיף serif תדמיתי רק לכותרות לטיניות. לכן הבחירה ב־Rubik 400/500/600 לממשק כולו וב־Cormorant Garamond 500/600 לכותרות אנגליות מסומנות בלבד מתאימה למדגם ומונעת ערבוב מקרי בתוך עברית.

## ביקורת עצמאית לאחר השדרוג

הביקורת מכסה את `/`, `/search`, `/category/rings`, `/product/[slug]`, `/elys-ai`, `/account`, `/checkout` והפוטר, בתצורות מובייל 390×844 ומחשב 1440×900. הראיות מבוססות על חוזי הרכיבים, בדיקות הנתיבים ובדיקות viewport; אלה אינן תחליף למחקר משתמשים או לבדיקה עם קטלוג ייצור מלא.

כל ההמלצות הבאות מסומנות **ממתין להחלטת בעלים** ולא יושמו.

| מזהה  | מסלול ומכשיר                      | צעדי שחזור / ראיה                                                                                                      | חומרה   | השפעה                                                  | מאמץ משוער            | המלצה                                                                            | סטטוס              |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ | --------------------- | -------------------------------------------------------------------------------- | ------------------ |
| UX-01 | `/account`, מובייל                | לפתוח כאורח ללא מידות, מועדפים או היסטוריה. שלושה אזורים ריקים מופיעים לפני ערך אישי ממשי.                             | בינונית | תחושת מרכז עמוס למשתמש חדש                             | קטן                   | להציג onboarding קצר אחד ולהרחיב כל אזור רק לאחר יצירת הנתון הראשון.             | ממתין להחלטת בעלים |
| UX-02 | `/account`, מובייל ומחשב          | לבטל הסכמת cookies ולפתוח את אזור נצפו לאחרונה. ההסבר קיים אך אין קיצור ישיר להגדרות הפרטיות מתוך האזור.               | בינונית | המשתמש מבין למה אין נתונים אך לא יכול לפתור זאת במקום  | קטן                   | להוסיף פעולה ממוקדת לפתיחת העדפות cookies ליד ההסבר.                             | ממתין להחלטת בעלים |
| UX-03 | `/elys-ai`, מובייל                | לפתוח מקלדת וירטואלית לאחר שיחה ארוכה; אזור ההמלצות והקלט מתחרים על גובה המסך.                                         | בינונית | הקלדה וסקירת מוצרים דורשות קפיצות גלילה                | בינוני                | לבחון composer דביק שמכבד safe-area וכפתור צמצום למסילת ההמלצות.                 | ממתין להחלטת בעלים |
| UX-04 | `/search`, מובייל                 | לבחור מספר פילטרים ואז לפתוח שוב את אזור הבקרה. הסיכום והצ'יפים מוסיפים גובה רב לפני התוצאות.                          | נמוכה   | זמן ארוך יותר לחזרה לתוצאות                            | קטן                   | להציג שורת סיכום דביקה קומפקטית לאחר החלת פילטרים.                               | ממתין להחלטת בעלים |
| UX-05 | `/product/[slug]`, מחשב           | לנווט במקלדת למסילות המלצה ארוכות. המכולה ניתנת למיקוד אך אין פעולה מפורשת לדילוג לסוף המסילה.                         | נמוכה   | יותר הקשות למשתמשי מקלדת                               | בינוני                | להוסיף פעולות הקודם/הבא נגישות במסילות שמכילות מעל סף פריטים.                    | ממתין להחלטת בעלים |
| UX-06 | כל המסלולים, מצב לילה             | להתקין כ־PWA ולהפעיל מצב לילה. צבע `theme_color` של מעטפת מערכת ההפעלה נשאר קבוע.                                      | נמוכה   | חוסר רציפות חזותית מחוץ ל־viewport                     | בינוני                | לסנכרן meta theme-color לפי מצב פעיל, תוך מניעת הבהוב hydration.                 | ממתין להחלטת בעלים |
| UX-07 | פוטר, מחשב                        | להגיע לתחתית עמוד ציבורי ולבדוק פרטי עוסק. כשהגדרות העסק חסרות, האזור מוסתר לחלוטין.                                   | גבוהה   | מידע מסחרי/משפטי עלול להיות חסר בהשקה                  | קטן לאחר קבלת הנתונים | להשלים שם עוסק, מספר רישום וכתובת לפני עלייה לייצור ולהוסיף בדיקת release חוסמת. | ממתין להחלטת בעלים |
| UX-08 | `/checkout`, מובייל               | למלא טופס עם שגיאות ולנוע בין focus ring, הודעה ופס הפעולה התחתון. יש כמה שכבות משוב במרחב קטן.                        | בינונית | עומס קוגניטיבי וסיכון להסתרת השדה הראשון השגוי         | בינוני                | לבצע סבב בדיקות קורא מסך ומקלדת ייעודי ולבחון צמצום מסרים כפולים.                | ממתין להחלטת בעלים |
| UX-09 | כותרות מותג מעורבות, מובייל ומחשב | להציג כותרת עם `elys-ai` בתוך משפט עברי. כלל `:lang(en)` אינו מופעל בלי סימון שפה מפורש.                               | נמוכה   | חוסר עקביות נקודתי בטיפוגרפיה                          | קטן                   | ליצור primitive טקסט לטיני שמוסיף `lang="en"` ו־`dir="ltr"` באופן עקבי.          | ממתין להחלטת בעלים |
| UX-10 | תפריט קליק ימני, מחשב             | לפתוח על רכיב אינטראקטיבי מקונן שאינו קישור, למשל control בתוך כרטיס. התפריט המקורי נשמר ולכן אין פעולת העתקה ייעודית. | נמוכה   | התנהגות נכונה נגישותית אך עלולה להפתיע משתמשים מתקדמים | בינוני                | לבדוק אנליטית אם נדרש command חלופי שאינו משתלט על תפריט הדפדפן.                 | ממתין להחלטת בעלים |

## קריטריונים להחלטה

מומלץ לתעד לכל מזהה החלטת בעלים: מאושר, נדחה או נדחה למועד; יעד גרסה; ובעל תפקיד. אין להמיר אף שורה למשימת פיתוח אוטומטית ללא החלטה מפורשת.
