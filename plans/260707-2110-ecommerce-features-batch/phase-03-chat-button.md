# Phase 3: Chat Button (Message Now)

## Context Links
- Site settings service: `/backend/src/internal/services/site_setting_service.go`
- Site settings repo: `/backend/src/internal/repositories/site_setting_repo.go`
- Site settings model: `/backend/src/internal/models/site_setting.go`
- Admin settings page: `/frontend/app/admin/(protected)/settings/page.tsx`
- Product detail page: `/frontend/app/[locale]/(main)/product/[id]/page.tsx`
- Routes: `/backend/src/internal/initialize/route.go`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1.5 hours

Add "Message Now" button on product detail page that links to admin-configured chat URL (Zalo, LINE, etc.).

## Key Insights
- Site settings pattern already exists (social links)
- Can extend `SocialLinksData` or create separate setting
- Frontend admin settings page provides template
- Button should appear next to "Add to Cart"

## Requirements

### Functional
- Admin can configure chat URL in settings page
- Button appears on product detail page
- Clicking opens chat URL in new tab
- Button hidden if URL not configured

### Non-Functional
- Reuse existing site settings infrastructure
- No authentication required for public endpoint

## Architecture

**Data Flow:**
```
Admin sets chat_url in settings
  -> Stored in site_settings table
  -> GET /api/v1/settings/chat-url (public)
  -> Product detail fetches on mount
  -> Display "Message Now" button
```

## Related Code Files

### Files to Modify

**Backend:**
- `backend/src/internal/services/site_setting_service.go` - Add GetChatURL method
- `backend/src/internal/initialize/route.go` - Add endpoint
- `backend/src/internal/controllers/site_setting_controller.go` - Add handler (create if needed)

**Frontend:**
- `frontend/lib/api-resources.ts` - Add getChatUrl function
- `frontend/app/admin/(protected)/settings/page.tsx` - Add chat URL field
- `frontend/app/[locale]/(main)/product/[id]/page.tsx` - Add chat button

### Files to Read (Context)
- Existing site_setting implementation for pattern reference

## Implementation Steps

### Backend

1. **Extend SiteSettingService** in `site_setting_service.go`:
   ```go
   type SiteSettingService interface {
       GetSocialLinks(ctx context.Context) (*SocialLinksData, error)
       UpdateSocialLinks(ctx context.Context, data *SocialLinksData) error
       GetChatURL(ctx context.Context) (string, error)
       UpdateChatURL(ctx context.Context, url string) error
   }
   
   func (s *siteSettingService) GetChatURL(ctx context.Context) (string, error) {
       setting, err := s.repo.GetSetting(ctx, "chat_url")
       if err != nil {
           if errors.Is(err, gorm.ErrRecordNotFound) {
               return "", nil
           }
           return "", err
       }
       return setting.Value, nil
   }
   
   func (s *siteSettingService) UpdateChatURL(ctx context.Context, url string) error {
       return s.repo.UpdateSetting(ctx, "chat_url", url)
   }
   ```

2. **Add controller handlers** (in site_setting_controller.go or new file):
   ```go
   // GetChatURL GET /api/v1/settings/chat-url (public)
   func GetChatURL(db *gorm.DB) fiber.Handler {
       return func(ctx fiber.Ctx) error {
           repo := repositories.NewPostgreSQLStorage(db)
           svc := services.NewSiteSettingService(repo)
           url, err := svc.GetChatURL(ctx.Context())
           if err != nil {
               return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
           }
           return ctx.JSON(fiber.Map{"data": fiber.Map{"chat_url": url}})
       }
   }
   
   // UpdateChatURL PUT /api/v1/admin/settings/chat-url (admin)
   func UpdateChatURL(db *gorm.DB) fiber.Handler {
       return func(ctx fiber.Ctx) error {
           var req struct {
               ChatURL string `json:"chat_url"`
           }
           if err := ctx.Bind().JSON(&req); err != nil {
               return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest)
           }
           repo := repositories.NewPostgreSQLStorage(db)
           svc := services.NewSiteSettingService(repo)
           if err := svc.UpdateChatURL(ctx.Context(), req.ChatURL); err != nil {
               return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
           }
           return ctx.SendStatus(fiber.StatusNoContent)
       }
   }
   ```

3. **Register routes** in `route.go`:
   ```go
   // In settings group (public)
   settings.Get("/chat-url", controllers.GetChatURL(db))
   
   // In adminSettings group
   adminSettings.Put("/chat-url", controllers.UpdateChatURL(db))
   ```

### Frontend

4. **Add API functions** in `api-resources.ts`:
   ```typescript
   export const adminSettings = {
       // ... existing
       getChatUrl(): Promise<{ data: { chat_url: string } }> {
           return request<{ data: { chat_url: string } }>("/settings/chat-url");
       },
       updateChatUrl(chatUrl: string): Promise<void> {
           return request<void>("/admin/settings/chat-url", {
               method: "PUT",
               body: JSON.stringify({ chat_url: chatUrl }),
           });
       },
   };
   ```

5. **Update admin settings page** - Add chat URL section:
   ```typescript
   // Add to state
   const [chatUrl, setChatUrl] = useState('');
   
   // Fetch in useEffect
   adminSettings.getChatUrl().then(res => setChatUrl(res.data.chat_url));
   
   // Add form field after social links section
   <div className="bg-white rounded-lg shadow-sm mt-6">
       <div className="p-6 border-b border-gray-200">
           <h2 className="text-lg font-semibold">Chat / Lien He</h2>
           <p className="text-sm text-gray-500">URL se hien thi nut "Nhan tin ngay" tren trang san pham</p>
       </div>
       <div className="p-6">
           <label className="block text-sm font-medium text-gray-700 mb-2">
               Chat URL (Zalo, LINE, Messenger...)
           </label>
           <input
               type="url"
               value={chatUrl}
               onChange={(e) => setChatUrl(e.target.value)}
               placeholder="https://zalo.me/..."
               className="w-full px-4 py-2 border border-gray-300 rounded-lg"
           />
           <button onClick={handleSaveChatUrl} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
               Luu
           </button>
       </div>
   </div>
   ```

6. **Add chat button to product detail page**:
   ```typescript
   // Add state
   const [chatUrl, setChatUrl] = useState<string | null>(null);
   
   // Fetch on mount
   useEffect(() => {
       adminSettings.getChatUrl()
           .then(res => setChatUrl(res.data.chat_url || null))
           .catch(() => {});
   }, []);
   
   // Add button next to Add to Cart
   {chatUrl && (
       <a
           href={chatUrl}
           target="_blank"
           rel="noopener noreferrer"
           className="w-full mt-3 border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
       >
           <MessageCircle className="w-5 h-5" />
           {t("messageNow")}
       </a>
   )}
   ```

7. **Add translation keys**:
   - `"messageNow": "Nhan tin ngay"` (vi)
   - `"messageNow": "今すぐメッセージ"` (ja)

## Todo List
- [ ] Add GetChatURL/UpdateChatURL to site_setting_service.go
- [ ] Add controller handlers
- [ ] Register routes in route.go
- [ ] Add API functions in api-resources.ts
- [ ] Update admin settings page with chat URL field
- [ ] Add chat button to product detail page
- [ ] Add translation keys
- [ ] Test full flow: admin sets URL -> user sees button

## Success Criteria
- [ ] Admin can set chat URL in settings
- [ ] "Message Now" button appears on product page when URL configured
- [ ] Button opens URL in new tab
- [ ] Button hidden when URL is empty

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Invalid URL saved | Low | Low | Validate URL format in frontend |
| Chat service unavailable | External | External | User's problem, not ours |

## Security Considerations
- Admin-only update endpoint (protected by JWT + role middleware)
- URL should be validated (basic URL format check)
- Avoid XSS: use `<a href>` not `dangerouslySetInnerHTML`
