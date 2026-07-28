import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/password";

describe("verifyPassword", () => {
  it("정답이면 통과한다", async () => {
    await expect(verifyPassword("hunter2", "hunter2")).resolves.toBe(true);
  });

  it("오답이면 거부한다", async () => {
    await expect(verifyPassword("wrong", "hunter2")).resolves.toBe(false);
  });

  it("길이가 다른 입력을 거부한다", async () => {
    await expect(verifyPassword("hunter", "hunter2")).resolves.toBe(false);
    await expect(verifyPassword("hunter22", "hunter2")).resolves.toBe(false);
  });

  it("빈 입력을 거부한다", async () => {
    await expect(verifyPassword("", "hunter2")).resolves.toBe(false);
  });

  // secret 주입이 실패했을 때 빈 비밀번호로 뚫리면 안 된다.
  it("정답이 비어 있으면 무엇을 넣어도 거부한다", async () => {
    await expect(verifyPassword("", "")).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });
});
