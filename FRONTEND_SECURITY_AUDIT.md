# Frontend Security & Code Quality Audit

## 🔴 CRITICAL ISSUES FOUND

### 1. **Excessive Logging & Debug Code in Production**

- **Location**: `frontend/src/app/Login/page.tsx`
- **Issue**: Multiple `console.log()` statements exposing sensitive data (tokens, user data, passwords)
- **Risk**: HIGH - Token exposure, security information leakage
- **Lines**: 60-130+ with debug logs
- **Action**: Remove all debug logs immediately

### 2. **Inconsistent Token Storage Keys**

- **Location**: `frontend/src/app/mei/[companyId]/calendario/page.tsx`
- **Issue**: Uses `localStorage.getItem('token')` instead of `'authToken'`
- **Risk**: MEDIUM - Authentication failures
- **Action**: Standardize to `'authToken'` everywhere

### 3. **Mixed Portuguese/English Code**

- **Locations**: All frontend files
- **Issue**: Variable names like `receita`, `despesa`, `empresa`, `usuario`
- **Examples**:
  - `const [receitas, setReceitas] = useState<Receita[]>([]);`
  - `interface Receita { ... }`
  - `const fetchReceitas = useCallback(...)`
- **Risk**: LOW - Code maintainability
- **Action**: Convert to English (keep UI text in Portuguese)

### 4. **Direct localStorage Access Pattern**

- **Locations**: 50+ instances across all pages
- **Issue**: Repeated `localStorage.getItem('authToken')` without validation
- **Risk**: MEDIUM - No centralized error handling
- **Current Pattern**:

```typescript
const token = localStorage.getItem('authToken');
const response = await fetch(..., {
  headers: { Authorization: `Bearer ${token}` }
});
```

- **Action**: Use existing `apiClient.ts` utility consistently

### 5. **No Input Sanitization on Client Side**

- **Locations**: All form inputs in MEI pages
- **Issue**: User inputs sent directly to API without client-side validation/sanitization
- **Risk**: MEDIUM - XSS potential, bad data
- **Action**: Use `sanitizeInput()` from `validation.ts`

## 🟡 MODERATE ISSUES

### 6. **Duplicate Utility Code**

- **Files**:
  - `auth.ts` has `tokenManager`
  - `apiClient.ts` has duplicate `tokenManager`
- **Issue**: Same code in two files
- **Action**: Keep in `auth.ts`, import in `apiClient.ts`

### 7. **Inconsistent Error Handling**

- **Pattern 1**: `console.error()` then nothing
- **Pattern 2**: `setError()` with user message
- **Pattern 3**: Try/catch with no user feedback
- **Action**: Standardize to `setError()` + user-friendly messages

### 8. **Missing Token Expiration Handling**

- **Issue**: `tokenManager.isTokenValid()` exists but not used consistently
- **Location**: Many fetch calls don't check token validity first
- **Action**: Always check before API calls

## 🟢 GOOD PRACTICES FOUND

✅ `apiClient.ts` utility exists with proper structure
✅ `validation.ts` has sanitization functions
✅ `auth.ts` has JWT decoding and validation
✅ Protection components (`MeiProtection`, `AdminProtection`) work correctly

## 📋 NAMING CONVENTION ISSUES

### Portuguese Variable Names to Convert:

```
receita → revenue (or income)
despesa → expense
empresa → company
usuario → user
calendario → calendar
planilha → spreadsheet
assinatura → subscription
```

### Files Requiring English Conversion:

- [ ] `/mei/receitas/page.tsx` → variables, interfaces, functions
- [ ] `/mei/despesas/page.tsx` → variables, interfaces, functions
- [ ] `/mei/[companyId]/receitas/page.tsx` → variables, interfaces, functions
- [ ] `/mei/[companyId]/despesas/page.tsx` → variables, interfaces, functions
- [ ] `/mei/[companyId]/calendario/page.tsx` → variables, interfaces, functions
- [ ] `MeiSidebar.tsx` → only code (UI text stays Portuguese)
- [ ] `AdminSidebar.tsx` → only code (UI text stays Portuguese)

## 🛠️ ACTION PLAN

### Phase 1: Critical Security Fixes

1. Remove all `console.log()` from Login page
2. Standardize token key to `'authToken'`
3. Remove token decoding debug code

### Phase 2: Code Standardization

1. Convert all Portuguese variable names to English
2. Convert all interfaces/types to English
3. Convert all function names to English
4. Keep ALL UI text in Portuguese

### Phase 3: Refactoring

1. Replace direct localStorage calls with `apiClient`
2. Add input sanitization to all forms
3. Consolidate duplicate `tokenManager` code
4. Standardize error handling pattern

### Phase 4: Cleanup

1. Remove unused imports
2. Remove commented code
3. Remove obvious comments
4. Add comments only for complex logic

## 📊 STATISTICS

- **Total localStorage.getItem calls**: 80+
- **Direct API fetch calls**: 50+
- **Console.log statements**: 20+
- **Portuguese variable names**: 100+
- **Files needing conversion**: 15+

## ✅ COMPLETION CHECKLIST

- [ ] No console.log in production code
- [ ] Single token key ('authToken')
- [ ] All code in English (UI in Portuguese)
- [ ] Consistent apiClient usage
- [ ] Input sanitization on all forms
- [ ] Standardized error handling
- [ ] No duplicate utility code
- [ ] Token validation before API calls
- [ ] Clean comments (English only)
- [ ] No dead code
