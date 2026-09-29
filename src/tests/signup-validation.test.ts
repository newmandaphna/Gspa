import { describe, expect, it } from "vitest";
import { inquiryInputSchema } from "@/lib/validation";
import { formatSignupPhone, validSignupEmail, validSignupZip } from "@/lib/signup-validation";

const signup = {
  kind: "membership",
  name: "Signup Test",
  email: "signup@example.com",
  phone: "(347) 886-0773",
  message: "Membership list (pre-opening)\nZIP: 00501\nNYC pistol license: Not yet applied\nHeard via: Search",
};

describe("pre-opening signup validation", () => {
  it("accepts assigned ZIPs, including leading zero; rejects unassigned ZIPs", () => {
    expect(validSignupZip("00501")).toBe(true);
    for (const zip of ["00000", "99999", "1000", "abcde", "K1A0B1"]) expect(validSignupZip(zip)).toBe(false);
    expect(inquiryInputSchema.safeParse(signup).success).toBe(true);
    expect(inquiryInputSchema.safeParse({ ...signup, message: signup.message.replace("00501", "00000") }).success).toBe(false);
    expect(inquiryInputSchema.safeParse({ ...signup, message: signup.message.replace("00501", "99999") }).success).toBe(false);
  });

  it("rejects malformed email syntax beyond the browser's built-in email check", () => {
    for (const email of ["a@localhost", "a@example.c", "a@example..com", "a@-example.com", "a..b@example.com", "a@example.com."]) {
      expect(validSignupEmail(email), email).toBe(false);
      expect(inquiryInputSchema.safeParse({ ...signup, email }).success, email).toBe(false);
    }
    expect(validSignupEmail("signup+test@example.com")).toBe(true);
  });

  it("rejects letters and invalid US numbers, accepts optional phone and formats valid input", () => {
    expect(formatSignupPhone("3478860773")).toBe("(347) 886-0773");
    expect(formatSignupPhone("+1 (347) 886-0773")).toBe("(347) 886-0773");
    expect(formatSignupPhone("")).toBe("");
    for (const phone of ["347FLOWERS", "347-886-ABCD", "1234567890", "555", "+44 20 7946 0958"]) {
      expect(formatSignupPhone(phone), phone).toBeNull();
      expect(inquiryInputSchema.safeParse({ ...signup, phone }).success, phone).toBe(false);
    }
    expect(inquiryInputSchema.safeParse({ ...signup, phone: "" }).success).toBe(true);
  });

  it("does not enforce signup ZIP/phone rules for legacy regular inquiries", () => {
    expect(inquiryInputSchema.safeParse({ ...signup, message: "Please contact me\nZIP: 00000", phone: "call me" }).success).toBe(true);
  });
});