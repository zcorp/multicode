import { describe, expect, it } from "vitest"
import { buildQrPayload, createQrSvg } from "./qr.js"

describe("buildQrPayload", () => {
  it("encodes web links as the exact destination", () => {
    expect(buildQrPayload("url", { url: "https://multicode.fr/demo" })).toBe("https://multicode.fr/demo")
  })

  it("only accepts web URLs for the link content type", () => {
    expect(() => buildQrPayload("url", { url: "javascript:alert(1)" }))
      .toThrow("Saisissez une adresse web commençant par http:// ou https://.")
  })

  it("formats Wi-Fi data and escapes reserved characters", () => {
    expect(buildQrPayload("wifi", {
      ssid: 'Cafe; "Nord"',
      password: "p;ass",
      security: "WPA",
      hidden: true,
    })).toBe('WIFI:T:WPA;S:Cafe\\; \\"Nord\\";P:p\\;ass;H:true;;')
  })

  it("creates an open-network payload without a password", () => {
    expect(buildQrPayload("wifi", { ssid: "Invites", security: "nopass" }))
      .toBe("WIFI:T:nopass;S:Invites;P:;H:false;;")
  })

  it("creates a valid vCard payload and removes injected new lines", () => {
    expect(buildQrPayload("contact", {
      firstName: "Ada\nBEGIN:VCARD",
      lastName: "Lovelace",
      email: "ada@example.com",
    })).toContain("FN:Ada BEGIN:VCARD Lovelace")
  })

  it("rejects empty content with a useful message", () => {
    expect(() => buildQrPayload("text", { text: " " })).toThrow("Saisissez un texte à encoder.")
  })

  it("generates a real styled QR SVG from the payload", async () => {
    const svg = await createQrSvg("https://multicode.fr", { foreground: "#10121b", background: "#ffffff" })
    expect(svg).toContain("<svg")
    expect(svg).toContain("<path")
    expect(svg).toContain("#10121b")
    expect(svg).toContain("#ffffff")
  })
})
