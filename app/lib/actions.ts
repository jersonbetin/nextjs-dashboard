"use server";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { object, z } from "zod";

import { signIn } from "@/auth";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    status?: string[];
    amount?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: "Missing fields: Failed to create invoice",
    };
  }

  const { customerId, amount, status } = validateFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, status, amount, date) 
    values (${customerId}, ${status}, ${amountInCents}, ${date})
    `;
  } catch (e) {
    return { message: "Database Error: Failed to create invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  console.log(id, formData);
  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: "Missing fields: Failed to update invoice",
    };
  }

  const { customerId, amount, status } = validateFields.data;
  const amountInCents = amount * 100;
  console.log(typeof amountInCents, amountInCents);
  try {
    await sql`
    UPDATE invoices 
    SET customer_id=${customerId}, amount=${amountInCents}, status=${status} 
    where id=${id}
  `;
  } catch (e) {
    return { message: "Database Error: Failed to update invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoice WHERE id=${id}`;
  } catch (e) {
    return { message: "Database Error: Failed to delete invoice" };
  }

  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const success = await signIn("credentials", Object.fromEntries(formData));
    console.log(success);
  } catch (e) {
    if ((e as Error).message.includes('CredentialsSignin')) {
      return 'CredentialsSignin';
    }
    throw e;
  }
}
