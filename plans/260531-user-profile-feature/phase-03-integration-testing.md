# Phase 3: Integration Testing

**Status:** pending
**Priority:** medium
**Effort:** ~30 minutes
**Depends on:** Phase 1, Phase 2

## Overview

Verify end-to-end functionality of profile feature.

## Test Scenarios

### 1. Menu Navigation
- [ ] Dropdown shows "Thông tin tài khoản" when logged in
- [ ] Clicking navigates to /profile
- [ ] Page redirects to /login if not authenticated

### 2. Profile Display
- [ ] User info loads correctly (name, email, phone)
- [ ] Avatar displays if set, else shows initial
- [ ] Email field is disabled/readonly

### 3. Update Personal Info
- [ ] Can update full_name
- [ ] Can update phone
- [ ] Shows success message on save
- [ ] Shows error on validation failure
- [ ] Phone uniqueness check works

### 4. Avatar Upload
- [ ] Click avatar opens file picker
- [ ] Upload updates avatar display
- [ ] Invalid file type rejected (backend)
- [ ] Large file handled gracefully

### 5. Password Change
- [ ] Wrong current password shows error
- [ ] Mismatched confirm password shows error
- [ ] Successful change shows success message
- [ ] Password min length validation (8 chars)

### 6. Error Handling
- [ ] Network error handled gracefully
- [ ] 401 redirects to login
- [ ] Form errors displayed inline

### 7. i18n
- [ ] Vietnamese labels correct
- [ ] Japanese labels correct
- [ ] Switch language updates labels

## Test Commands

```bash
# Backend tests
cd backend && go test ./src/internal/services/... -v

# Frontend build check
cd frontend && npm run build

# Manual e2e test
# 1. Start docker: make up
# 2. Open browser: http://localhost/
# 3. Login → Profile → Test each scenario
```

## Verification Checklist

- [ ] All backend endpoints respond correctly
- [ ] All frontend forms work
- [ ] i18n complete for both languages
- [ ] No console errors in browser
- [ ] Mobile responsive layout works
