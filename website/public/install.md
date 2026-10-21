# ثبّت 3ameiah

3ameiah عبارة عن ست Agent Skills للعامية المصرية الطبيعية، والفرانكو المقروء،
وبروفايلات نبرة محلية تقدر تتعلم أسلوبك. المشروع Open Source، ومصدره الأساسي
موجود على [GitHub](https://github.com/abdullah-elbedwehy/3ameiah).

## ابعت الرسالة دي للـAgent

انسخ الرسالة زي ما هي:

```text
ثبّتلي 3ameiah من https://3ameiah.elbedwehy.tech بعد ما تراجع المصدر، وبعدها اتأكد إن الأوامر الستة شغالة.
```

لازم تبعتها لـcoding agent عنده صلاحية يفتح Terminal، يوصل للإنترنت، ويكتب ملفات
على جهازك. لو الأداة شات بس ومفيش عندها Terminal أو filesystem access، تقدر
تشرحلك أو تطبّق الأسلوب جوّه المحادثة، إنما ما تقدرش تثبّت ملفات أو تتأكد إن
التثبيت حصل على جهازك.

## لو هتثبّتها بنفسك من الـTerminal

راجع [المصدر](https://github.com/abdullah-elbedwehy/3ameiah) والـscripts المرفقة الأول، وبعدها شغّل:

```bash
npx 3ameiah install
```

الكوماند الحالي محتاج Node.js 22.20.0 أو أحدث، وبيثبّت الـSkills الستة بشكل
global لـClaude Code وCodex كاختيار افتراضي. لو بتستخدم Agent تاني، أو عايز تثبيت
جوّه المشروع بس، راجع
[دليل التثبيت الكامل للـAgents](https://github.com/abdullah-elbedwehy/3ameiah/blob/main/INSTALL-FOR-AGENTS.md)
أو
[نسخة Markdown الخام](https://raw.githubusercontent.com/abdullah-elbedwehy/3ameiah/main/INSTALL-FOR-AGENTS.md).

قبل ما تستبدل أي Skill بنفس الاسم، اتأكد إن النسخة الموجودة ما فيهاش تعديلات محلية.
لو فيها، اعمل Backup أو وقف واطلب قرار واضح بدل ما تكتب فوقها.

## الأوامر الستة

| اسم الـSkill | بتستخدمها في إيه |
| --- | --- |
| `3ameiah` | عامية مصرية طبيعية ومتوازنة لمعظم الشغل |
| `3ameiah-pro` | مصري واضح ومحترم للشغل والعملاء |
| `3ameiah-friendly` | مصري دافي وقريب من غير حشو أو افتعال |
| `3ameiah-franco` | فرانكو مصري مقروء، مش ترجمة لإنجليزي |
| `3ameiah-learn` | تعمل أو تحسّن بروفايل نبرة محلي |
| `3ameiah-use` | تختار بروفايل وتستخدمه في المهمة |

دي أسماء الـSkills الثابتة. طريقة استدعائها بتختلف حسب الـAgent: Claude Code غالبًا
بيستخدم `/3ameiah`، وCodex غالبًا بيستخدم `$3ameiah`، وأدوات تانية ممكن تستخدم
prefix مختلف، قائمة Skills، أو طلب بالكلام الطبيعي.

## اتأكد إن التثبيت تم

شغّل:

```bash
npx 3ameiah doctor
```

لازم تشوف الأسماء الستة بالظبط:

```text
3ameiah
3ameiah-pro
3ameiah-friendly
3ameiah-franco
3ameiah-learn
3ameiah-use
```

وممكن تراجع قائمة المثبّت الأساسية مباشرة:

```bash
npx --yes skills@1.5.22 list --global --json
```

لو الـAgent بيعمل cache للـSkills، اعمل reload أو restart بالطريقة المناسبة للأداة،
وبعدها خليه يقولك صيغة الاستدعاء الدقيقة عنده. ظهور الأسماء الستة بيثبت إن ملفات
الـSkills اتثبتت واتسجلت؛ لوحده مش اختبار لجودة كل رد. وما تعملش بروفايل تجريبي
من غير ما تكون عايز ده فعلًا، لأن `3ameiah-learn` و`3ameiah-use` ممكن يكتبوا في
إعدادات المستخدم.

## حدود القدرة

3ameiah مش موديل AI مستقل، ومش خدمة شات، ومش أداة بتدي صلاحيات. هي تعليمات وأدوات
محلية بتساعد الـAgent يكتب أو يعيد صياغة المحتوى البشري بالمصري أو بالفرانكو وهو
بينفّذ المهمة الحقيقية. تثبيتها ما بيديش الـAgent Terminal أو filesystem أو network
أو صلاحية نشر وDeploy ما كانتش موجودة عنده أصلًا، وما بيلغيش أي موافقات مطلوبة.

لو معاك LLM شات بس، تقدر تديله
[ملف الـcore skill الخام](https://raw.githubusercontent.com/abdullah-elbedwehy/3ameiah/main/skills/3ameiah/SKILL.md)
عشان يطبّقه مؤقتًا في نفس المحادثة. ده استخدام مؤقت، مش تثبيت على جهازك.

## المصدر والرخصة والخصوصية

- المصدر الأساسي: [github.com/abdullah-elbedwehy/3ameiah](https://github.com/abdullah-elbedwehy/3ameiah)
- npm: [npmjs.com/package/3ameiah](https://www.npmjs.com/package/3ameiah)
- دليل التثبيت للـAgents: [INSTALL-FOR-AGENTS.md](https://github.com/abdullah-elbedwehy/3ameiah/blob/main/INSTALL-FOR-AGENTS.md)
- الرخصة: [MIT](https://github.com/abdullah-elbedwehy/3ameiah/blob/main/LICENSE)
- تفاصيل الأمان: [SECURITY.md](https://github.com/abdullah-elbedwehy/3ameiah/blob/main/SECURITY.md)
- تخزين البروفايلات والخصوصية: [docs/PROFILES.md](https://github.com/abdullah-elbedwehy/3ameiah/blob/main/docs/PROFILES.md)

3ameiah نفسها مفيهاش Telemetry ومفيهاش `postinstall` hook. التثبيت بيستخدم
universal skills installer مثبّت على نسخة محددة؛ المثبّت بيعمل remote metadata
checks وعنده anonymous install telemetry تقدر توقفها. لو عايز توقفها، استخدم واحد
من دول وقت التثبيت:

```bash
DO_NOT_TRACK=1 npx 3ameiah install
```

أو:

```bash
DISABLE_TELEMETRY=1 npx 3ameiah install
```

بروفايلات النبرة بتتخزن في إعدادات المستخدم العالمية برا أي repository. عينات
الكتابة الكاملة ما بتدخلش تلقائيًا في سياق الموديل، إلا لو إنت طلبت ده بشكل صريح.
