import QRCode from "qrcode"

export const QR_TYPES = [
  { id: "url", label: "Lien web" },
  { id: "text", label: "Texte" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "contact", label: "Contact" },
  { id: "email", label: "E-mail" },
  { id: "phone", label: "Téléphone" },
]

const cleanVCardValue = (value) => String(value || "").replace(/[\r\n]/g, " ").trim()

function escapeWifiValue(value) {
  return String(value || "").replace(/([\\;,:"])/g, "\\$1")
}

export function buildQrPayload(type, fields) {
  if (type === "url") {
    const url = String(fields.url || "").trim()
    if (!url) throw new Error("Saisissez un lien à encoder.")
    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error()
    } catch {
      throw new Error("Saisissez une adresse web commençant par http:// ou https://.")
    }
    return url
  }

  if (type === "text") {
    const text = String(fields.text || "").trim()
    if (!text) throw new Error("Saisissez un texte à encoder.")
    return text
  }

  if (type === "wifi") {
    const ssid = String(fields.ssid || "").trim()
    if (!ssid) throw new Error("Saisissez le nom du réseau Wi-Fi.")
    const security = fields.security || "WPA"
    const password = security === "nopass" ? "" : escapeWifiValue(fields.password)
    return `WIFI:T:${security};S:${escapeWifiValue(ssid)};P:${password};H:${fields.hidden ? "true" : "false"};;`
  }

  if (type === "contact") {
    const firstName = cleanVCardValue(fields.firstName)
    const lastName = cleanVCardValue(fields.lastName)
    if (!firstName && !lastName) throw new Error("Saisissez au moins un nom ou un prénom.")
    const fullName = [firstName, lastName].filter(Boolean).join(" ")
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${fullName}`,
    ]
    if (fields.phone) lines.push(`TEL;TYPE=CELL:${cleanVCardValue(fields.phone)}`)
    if (fields.email) lines.push(`EMAIL:${cleanVCardValue(fields.email)}`)
    if (fields.organization) lines.push(`ORG:${cleanVCardValue(fields.organization)}`)
    if (fields.url) lines.push(`URL:${cleanVCardValue(fields.url)}`)
    lines.push("END:VCARD")
    return lines.join("\r\n")
  }

  if (type === "email") {
    const to = String(fields.to || "").trim()
    if (!to) throw new Error("Saisissez une adresse e-mail.")
    const params = new URLSearchParams()
    if (fields.subject) params.set("subject", fields.subject)
    if (fields.body) params.set("body", fields.body)
    const query = params.toString()
    return `mailto:${to}${query ? `?${query}` : ""}`
  }

  if (type === "phone") {
    const phone = String(fields.phone || "").trim()
    if (!phone) throw new Error("Saisissez un numéro de téléphone.")
    return `tel:${phone}`
  }

  throw new Error("Ce type de contenu n’est pas disponible.")
}

export function createQrSvg(payload, colors) {
  return QRCode.toString(payload, {
    type: "svg",
    width: 1000,
    margin: 3,
    errorCorrectionLevel: "Q",
    color: { dark: colors.foreground, light: colors.background },
  })
}
