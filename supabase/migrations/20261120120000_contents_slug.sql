-- Readable addresses for articles (/contents/<slug> instead of /contents/<uuid>) and a real "last modified" date.
--
-- slug: stored, not derived, so editing a title never changes an address that was already shared. Unique when set.
--       The CHECK mirrors isValidSlug() in netlify/edge-functions/lib/slug.ts (no spaces or URL-special characters,
--       not an id, not the reserved word "admin", which is the /contents/admin page).
-- updated_at: starts as the publish date (we do not know the true edit dates of older articles), and from now on a
--       trigger sets it on every update. It feeds Article.dateModified and the sitemap's <lastmod>.
-- The first slugs below were computed from the titles of the 57 published articles (oldest keeps the plain address
-- when two titles are the same; four were chosen by hand because the title alone makes a poor address).

ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.contents SET updated_at = COALESCE(published_at, created_at, now()) WHERE updated_at IS NULL;

ALTER TABLE public.contents ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.contents ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.contents DROP CONSTRAINT IF EXISTS contents_slug_format;
ALTER TABLE public.contents ADD CONSTRAINT contents_slug_format CHECK (
  slug IS NULL OR (
    char_length(slug) BETWEEN 1 AND 100
    AND slug ~ '^[^[:space:]/?#%\\]+$'
    AND slug !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND slug <> 'admin'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contents_slug_key ON public.contents (slug) WHERE slug IS NOT NULL;

-- first slugs (only where none is set yet, so re-running changes nothing)
UPDATE public.contents SET slug = 'אין-לי-זמן-לעשות-כסף' WHERE id = '7f2a80c1-5197-470c-9e97-7f8fe3dcd299' AND slug IS NULL;
UPDATE public.contents SET slug = 'אם-רק-הייתי-משקיע' WHERE id = '687ebcbd-d459-45a5-8ddd-1281a315da44' AND slug IS NULL;
UPDATE public.contents SET slug = 'know-like-trust-1' WHERE id = 'e0ea7e95-daf1-4033-a66f-cc5d93ef1aff' AND slug IS NULL;
UPDATE public.contents SET slug = 'know-like-trust-2' WHERE id = 'c1e65060-4187-4890-8221-801f784eed14' AND slug IS NULL;
UPDATE public.contents SET slug = 'מסגרות' WHERE id = '428e9799-e173-47f5-b51b-bf7c19041eff' AND slug IS NULL;
UPDATE public.contents SET slug = 'עתיד-המקצוע-שלנו-בעידן-ה-ai' WHERE id = '9dc0cd2f-c499-4e71-b6c7-d74c9af35c26' AND slug IS NULL;
UPDATE public.contents SET slug = 'איך-משיגים-את-המטופלים-הראשונים-לקליניקה-פרטית' WHERE id = 'cfe028d0-1796-40da-955c-fd9d1f9927cf' AND slug IS NULL;
UPDATE public.contents SET slug = 'why-therapists-who-hate-marketing-are-actually-right' WHERE id = '7ebd38b6-7242-45c6-ba51-1a26e26e70d0' AND slug IS NULL;
UPDATE public.contents SET slug = 'can-therapists-market-themselves-without-losing-their-soul' WHERE id = '4f45f822-08e6-4257-88f4-7a1d596acfdc' AND slug IS NULL;
UPDATE public.contents SET slug = 'the-real-reason-therapists-undercharge-and-its-not-what-you' WHERE id = '5b49c05d-cc95-4434-98e1-9b847469c682' AND slug IS NULL;
UPDATE public.contents SET slug = 'know-like-trust-for-therapists-why-building-a-practice-is' WHERE id = '6ccb0752-301e-4010-8441-0c22671c9783' AND slug IS NULL;
UPDATE public.contents SET slug = 'how-to-get-your-first-private-practice-clients-without-paid' WHERE id = '70ae64c9-1f98-4c38-84ac-21c4d23bf8a7' AND slug IS NULL;
UPDATE public.contents SET slug = 'שפה-טיפולית-ושפה-עסקית-הילכו-שניהם-יחדיו' WHERE id = 'fa38a5d7-6aeb-4c75-a424-c93ff24b8e20' AND slug IS NULL;
UPDATE public.contents SET slug = 'שפת-הטיפול-ושפת-המכירה' WHERE id = 'bb8ab035-119a-4e31-a298-50cdd319d1ea' AND slug IS NULL;
UPDATE public.contents SET slug = 'האם-יש-לשירות-שלך-זהות-ייחודית-ובין-הורות-לשירות' WHERE id = 'f0106fde-f839-4e4a-83f3-010b05a77723' AND slug IS NULL;
UPDATE public.contents SET slug = 'איך-משווקים-טיפול' WHERE id = 'f81c65e9-d870-4126-a80a-edfe0627ca2a' AND slug IS NULL;
UPDATE public.contents SET slug = 'הכוח-הפנימי-לשווק' WHERE id = '7289a97e-fef2-4cd2-b801-b3f61d300b91' AND slug IS NULL;
UPDATE public.contents SET slug = 'מה-עושים-כשאין-שום-חשק-לקדם-את-הקליניקה' WHERE id = 'aea65a59-7b4a-4a0a-be1d-6ef7e8798878' AND slug IS NULL;
UPDATE public.contents SET slug = 'אאוטסורסינג' WHERE id = '8b6fd700-23d8-4ae5-85f5-7ea58cf95002' AND slug IS NULL;
UPDATE public.contents SET slug = 'לשווק-בעצמי-חלק-1' WHERE id = '6d0e085e-7499-42b4-b071-ae37be62eb80' AND slug IS NULL;
UPDATE public.contents SET slug = 'מחשבות-חוזרות-על-שיווק' WHERE id = 'f2ba4360-f3a7-4b8c-bd8f-e6e73bada9e4' AND slug IS NULL;
UPDATE public.contents SET slug = 'מיצוב-באמצעות-פוסטים' WHERE id = 'a6005e68-08a4-4ccd-af11-46ea6912fbdd' AND slug IS NULL;
UPDATE public.contents SET slug = 'בטחון-לתמחר-נכון' WHERE id = '400c7dda-bd0a-4c25-9c3a-2624fc1b114e' AND slug IS NULL;
UPDATE public.contents SET slug = 'איש-טיפול-או-איש-עסקים-מי-אני-בדיוק' WHERE id = '0be1bd1b-6aa8-4d0b-96f5-45f7341358c2' AND slug IS NULL;
UPDATE public.contents SET slug = 'האם-יש-למטפלים-פוטנציאל-שיווקי-או-שכל-ניסיון-נדון-לכישלון' WHERE id = '0863947c-2cea-4b01-be25-fda0c214da07' AND slug IS NULL;
UPDATE public.contents SET slug = 'outsourcing' WHERE id = 'cc041f68-8eeb-4f65-9950-c4f5f4ed22b2' AND slug IS NULL;
UPDATE public.contents SET slug = 'השאלה-שכדאי-לשאול-את-עצמך' WHERE id = 'e60b257c-9b09-4592-84b6-e0613d75847c' AND slug IS NULL;
UPDATE public.contents SET slug = 'קליניקה-כעסק-1' WHERE id = '6f135c34-890d-448d-bea4-826d00ea2bb7' AND slug IS NULL;
UPDATE public.contents SET slug = 'קביעת-מטרות' WHERE id = '5028b331-a219-4ccb-80ab-52965df1368f' AND slug IS NULL;
UPDATE public.contents SET slug = 'חשיבה-אסטרטגית' WHERE id = '074e76bb-74ed-42b3-b7a9-59f10a3d3250' AND slug IS NULL;
UPDATE public.contents SET slug = 'אפקט-הדומינו-2' WHERE id = '14446b36-8a94-47b7-b379-17b9d911f9bf' AND slug IS NULL;
UPDATE public.contents SET slug = 'על-חיסכון-והוצאות' WHERE id = '2e7f6abf-ea88-4fcd-b88e-c2b693ac9b4c' AND slug IS NULL;
UPDATE public.contents SET slug = 'ניהול-העסק-בתקופות-מתח' WHERE id = '1b1c8f29-f6dd-4f8f-be6e-e545f9ef9140' AND slug IS NULL;
UPDATE public.contents SET slug = 'מטופלים-בשירות-הציבורי-והפרטי' WHERE id = '96b93ee9-1819-4300-bab6-44a77825d596' AND slug IS NULL;
UPDATE public.contents SET slug = 'לעבור-לתכנון-אסטרטגי' WHERE id = '101470b9-7da6-4723-862d-80ca4bd517cc' AND slug IS NULL;
UPDATE public.contents SET slug = 'הצורך-באסטרטגיה' WHERE id = '903ce78e-abf1-4c89-8b5b-07658fc10317' AND slug IS NULL;
UPDATE public.contents SET slug = 'הלוואי-שיכולתי-לתת-את-הטיפול-חינם' WHERE id = 'de8c9ca5-d4dc-4d15-abde-b4a490ce661a' AND slug IS NULL;
UPDATE public.contents SET slug = 'האם-שוב-חסכת-מעעצמך' WHERE id = '700456b1-a3e5-426b-acd2-b8bdba888904' AND slug IS NULL;
UPDATE public.contents SET slug = 'אפקט-הדומינו' WHERE id = '2c3bfda6-6936-40f7-b3d7-0876353a4393' AND slug IS NULL;
UPDATE public.contents SET slug = 'אם-רק-הייתי-משקיע-2' WHERE id = 'fab69eca-33c1-4ff5-a892-2fc268a6472b' AND slug IS NULL;
UPDATE public.contents SET slug = 'אין-לי-זמן-לעשות-כסף-2' WHERE id = 'ef029bb1-42e3-4710-9a28-fd46751922b3' AND slug IS NULL;
UPDATE public.contents SET slug = 'ביקורת' WHERE id = 'fc8f4cc0-ef53-41c0-8583-ecdd7c51e8cd' AND slug IS NULL;
UPDATE public.contents SET slug = 'דורות-של-פסיכולוגים-מצקצקים-כתיבת-תוכן' WHERE id = '85be1716-9a5b-4fb6-8f50-32249d6208c3' AND slug IS NULL;
UPDATE public.contents SET slug = 'האומץ-לנראות' WHERE id = 'c5bc16fd-2425-4b17-a17c-b7f0849fa0d7' AND slug IS NULL;
UPDATE public.contents SET slug = 'האם-אני-מספיק-מקצוען' WHERE id = '1e0eb947-28f6-4300-80eb-4b3a2cac361f' AND slug IS NULL;
UPDATE public.contents SET slug = 'המכשול-הפנימי' WHERE id = '00fff4e3-1dc8-4ba4-90e5-3924e5acbc4a' AND slug IS NULL;
UPDATE public.contents SET slug = 'חרדת-נטישה' WHERE id = '385d9e55-bb90-42bc-adda-404c95315640' AND slug IS NULL;
UPDATE public.contents SET slug = 'טעינות-רגשית-סביב-כסף' WHERE id = 'cc4e7e7a-f120-4a86-a5bc-e704ce83c5ae' AND slug IS NULL;
UPDATE public.contents SET slug = 'כסף-מצד-המטופלים' WHERE id = '30cecfc9-df44-4baf-9908-0cea27fdef89' AND slug IS NULL;
UPDATE public.contents SET slug = 'מורה-טוב-מורה-לחיים' WHERE id = '4c888809-bc15-4658-a873-7d1073207e52' AND slug IS NULL;
UPDATE public.contents SET slug = 'מחיר-כערך-עצמי' WHERE id = '9ff72f37-14fd-415f-a06b-8bc148a2370c' AND slug IS NULL;
UPDATE public.contents SET slug = 'מטפל-טוב-דיו-מעודכן' WHERE id = 'd126abfc-97e8-4f89-9bf4-6e75b2b9c2a5' AND slug IS NULL;
UPDATE public.contents SET slug = 'מפלצות' WHERE id = '16cad3cb-84ff-4277-bddb-92e20ee870de' AND slug IS NULL;
UPDATE public.contents SET slug = 'עסקה-מצילת-חיים' WHERE id = 'c9a5362b-3d7b-44b0-8f38-a09baa3bf18a' AND slug IS NULL;
UPDATE public.contents SET slug = 'המשגה-וחוסר-בטחון' WHERE id = '736695db-d685-4ed0-8b2b-369492dbb58a' AND slug IS NULL;
UPDATE public.contents SET slug = 'שער-המראה' WHERE id = 'c4d119cd-e38c-4217-8951-d84025dde603' AND slug IS NULL;
UPDATE public.contents SET slug = 'קונפליקטים' WHERE id = '64108d3f-6fdc-4848-a6eb-c9fe704b847d' AND slug IS NULL;

-- the trigger comes LAST: created earlier it would stamp every article as edited "now" while the slugs above are written
DROP TRIGGER IF EXISTS update_contents_updated_at ON public.contents;
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
