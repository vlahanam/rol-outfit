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
      name: z.string().min(2, t("nameMin")),
      email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
      phone: z
        .string()
        .min(1, t("phoneRequired"))
        .regex(/^\d{9,11}$/, t("phoneInvalid")),
      address: z.string().min(1, t("addressRequired")),
      password: z.string().min(8, t("passwordMin")),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMismatch"),
      path: ["confirmPassword"],
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
      nameMin: "Họ và tên phải có ít nhất 2 ký tự",
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      phoneRequired: "Vui lòng nhập số điện thoại",
      phoneInvalid: "Số điện thoại phải có 9-11 chữ số",
      addressRequired: "Vui lòng nhập địa chỉ",
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
    address: z.string().optional(),
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
  address: z.string().optional(),
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

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddUserInput = z.infer<typeof addUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type AddProductInput = z.infer<typeof addProductSchema>;
