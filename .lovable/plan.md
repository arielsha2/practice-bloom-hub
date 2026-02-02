
# תיקון שגיאות ניתוב ו-Select

## שינויים נדרשים

### 1. תיקון קובץ _redirects

| קובץ | שינוי |
|------|-------|
| `public/_redirects` | הוספת `/` לפני `index.html` |

**תוכן חדש:**
```text
/* /index.html 200
```

### 2. תיקון Select ב-PortalAdmin.tsx

| קובץ | שורות | שינוי |
|------|-------|-------|
| `src/pages/PortalAdmin.tsx` | 297-308 | טיפול בערך ריק עם `__none__` |

**לפני:**
```typescript
<Select value={selectedCourseKey} onValueChange={setSelectedCourseKey}>
```

**אחרי:**
```typescript
<Select 
  value={selectedCourseKey || '__none__'} 
  onValueChange={(value) => setSelectedCourseKey(value === '__none__' ? '' : value)}
>
```

ובנוסף הוספת אופציה "כל הקורסים":
```typescript
<SelectItem value="__none__">
  {isRTL ? 'כל הקורסים' : 'All courses'}
</SelectItem>
```

## סיכום

| קובץ | סוג שינוי |
|------|----------|
| `public/_redirects` | עדכון תוכן |
| `src/pages/PortalAdmin.tsx` | תיקון Select |
