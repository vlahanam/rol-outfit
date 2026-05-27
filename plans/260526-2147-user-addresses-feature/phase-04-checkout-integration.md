# Phase 4: Checkout Integration

**Status:** pending | **Effort:** 30min | **Priority:** medium

## Overview
Auto-fill checkout form with default address. User can still edit or leave empty.

## Files to Modify

### Checkout Page (`frontend/app/[locale]/(main)/checkout/page.tsx`)

#### Changes Required

1. **Import userAddresses API:**
```typescript
import { userAddresses } from "@/lib/api-resources";
```

2. **Add state for default address:**
```typescript
const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
```

3. **Fetch default address in useEffect:**
```typescript
// Inside fetchCart or separate effect
const fetchDefaultAddress = async () => {
  try {
    const res = await userAddresses.list();
    const addresses = res.data ?? [];
    const def = addresses.find(a => a.is_default);
    if (def) setDefaultAddress(def);
  } catch {
    // Ignore - user may not have addresses
  }
};
```

4. **Update useForm with defaultValues:**
```typescript
const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm({
  resolver: zodResolver(checkoutSchema),
  defaultValues: {
    shipping_address: "",
    phone: "",
    note: "",
  },
});

// After defaultAddress is fetched, reset form
useEffect(() => {
  if (defaultAddress) {
    reset({
      shipping_address: defaultAddress.address,
      phone: defaultAddress.phone,
      note: "",
    });
  }
}, [defaultAddress, reset]);
```

5. **Add recipient name display (optional):**
Show a hint above the form if default address is used:
```tsx
{defaultAddress && (
  <div className="text-sm text-gray-500 mb-2">
    {t("usingDefaultAddress", { name: defaultAddress.recipient_name })}
  </div>
)}
```

### i18n Updates
**en.json CheckoutPage:**
```json
"usingDefaultAddress": "Using default address for {name}"
```

**vn.json CheckoutPage:**
```json
"usingDefaultAddress": "Đang dùng địa chỉ mặc định của {name}"
```

## Flow
```
User enters checkout
       ↓
Fetch cart items + default address (parallel)
       ↓
Form pre-fills with default address (if exists)
       ↓
User can edit or clear fields
       ↓
Submit creates order with form values
```

## Edge Cases
- No default address → form stays empty (current behavior)
- User edits pre-filled address → use edited values
- Default address deleted before submit → form keeps edited values

## Todo
- [ ] Import userAddresses API
- [ ] Add defaultAddress state
- [ ] Fetch default address on mount
- [ ] Reset form with default values
- [ ] Add i18n keys
- [ ] Test auto-fill behavior
- [ ] Test edit override behavior
