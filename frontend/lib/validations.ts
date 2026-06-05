import { z } from "zod";

// Factory functions for locale-aware schemas (public pages)
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
      password: z.string().min(8, t("passwordMin")),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export function createCheckoutSchema(t: (key: string) => string) {
  return z.object({
    shipping_address: z
      .string()
      .min(10, t("addressTooShort"))
      .max(500, t("addressTooLong")),
    phone: z
      .string()
      .regex(/^[0-9]{9,15}$/, t("invalidPhone")),
    note: z.string().max(500).optional(),
  });
}

// Static schemas (admin pages – Vietnamese only)
export const loginSchema = createLoginSchema(
  (k) =>
    ({
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      passwordRequired: "Vui lòng nhập mật khẩu",
    })[k] ?? k,
);

export const registerSchema = createRegisterSchema(
  (k) =>
    ({
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự",
      confirmPasswordRequired: "Vui lòng xác nhận mật khẩu",
      passwordsMismatch: "Mật khẩu không khớp",
    })[k] ?? k,
);

export const addUserSchema = z
  .object({
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phone: z.string().optional(),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    role: z.string(),
    status: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export const editUserSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  phone: z.string().optional(),
  role: z.string(),
  status: z.string(),
});

// Dynamic variant schema — attribute fields derived from product's attribute_names.
export function createVariantSchema(attributeNames: string[]) {
  const attrShape = Object.fromEntries(
    attributeNames.map((name) => [
      name,
      z.string().min(1, `Vui lòng nhập ${name}`),
    ]),
  );
  return z.object({
    ...attrShape,
    price: z
      .string()
      .min(1, "Vui lòng nhập giá")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        "Giá phải lớn hơn 0",
      ),
    stock: z
      .string()
      .min(1, "Vui lòng nhập tồn kho")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0,
        "Tồn kho không được âm",
      ),
  });
}

export const addProductSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên sản phẩm"),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
  default_price: z
    .string()
    .min(1, "Vui lòng nhập giá mặc định")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "Giá không hợp lệ",
    ),
  description: z.string().optional(),
});

export const addCategorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
});

export const editCategorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
  status: z.string(),
});

export const addTagSchema = z
  .object({
    name: z.string().min(2, "Tên thẻ tag phải có ít nhất 2 ký tự"),
    start_at: z.string().optional(),
    end_at: z.string().optional(),
  })
  .refine(
    (d) => !d.start_at || !d.end_at || new Date(d.start_at) <= new Date(d.end_at),
    { message: "Thời gian kết thúc phải sau thời gian bắt đầu", path: ["end_at"] },
  );

export const editTagSchema = addTagSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddUserInput = z.infer<typeof addUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type AddProductInput = z.infer<typeof addProductSchema>;
