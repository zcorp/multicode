import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material"
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded"
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import { buildQrPayload, createQrSvg, QR_TYPES } from "./qr.js"

const STORAGE_KEY = "multicode-static-codes-v1"
const INITIAL_FIELDS = { url: "", text: "", ssid: "", security: "WPA", firstName: "", lastName: "", to: "", phone: "" }

function readSavedCodes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    return { items: Array.isArray(saved) ? saved : [], error: "" }
  } catch {
    return { items: [], error: "Les codes ne peuvent pas être lus depuis le stockage de ce navigateur." }
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function filenameFor(name, extension) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "")
  return `${slug || "multicode-qr"}.${extension}`
}

function TypeFields({ type, fields, onChange }) {
  const set = (key) => (event) => onChange((current) => ({ ...current, [key]: event.target.value }))

  if (type === "url") {
    return (
      <TextField
        autoFocus
        fullWidth
        required
        type="url"
        label="Adresse du site"
        placeholder="https://exemple.fr"
        value={fields.url}
        onChange={set("url")}
        helperText="Le QR code ouvrira directement cette adresse."
      />
    )
  }

  if (type === "text") {
    return (
      <TextField
        autoFocus
        fullWidth
        required
        multiline
        minRows={4}
        label="Votre texte"
        placeholder="Écrivez le texte à afficher après le scan"
        value={fields.text}
        onChange={set("text")}
        inputProps={{ maxLength: 1800 }}
        helperText={`${fields.text.length} / 1 800 caractères`}
      />
    )
  }

  if (type === "wifi") {
    return (
      <Stack spacing={2}>
        <TextField autoFocus fullWidth required label="Nom du réseau (SSID)" value={fields.ssid} onChange={set("ssid")} />
        <FormControl fullWidth>
          <InputLabel id="wifi-security-label">Sécurité</InputLabel>
          <Select labelId="wifi-security-label" label="Sécurité" value={fields.security} onChange={set("security")}>
            <MenuItem value="WPA">WPA / WPA2</MenuItem>
            <MenuItem value="WEP">WEP</MenuItem>
            <MenuItem value="nopass">Réseau ouvert</MenuItem>
          </Select>
        </FormControl>
        {fields.security !== "nopass" && (
          <TextField fullWidth label="Mot de passe Wi-Fi" value={fields.password || ""} onChange={set("password")} />
        )}
        <Alert severity="info" sx={{ alignItems: "center" }}>
          Les informations Wi-Fi sont intégrées au QR code. Ne le partagez qu’avec les personnes autorisées.
        </Alert>
      </Stack>
    )
  }

  if (type === "contact") {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField autoFocus fullWidth label="Prénom" value={fields.firstName} onChange={set("firstName")} />
          <TextField fullWidth label="Nom" value={fields.lastName} onChange={set("lastName")} />
        </Stack>
        <TextField fullWidth type="tel" label="Téléphone (facultatif)" value={fields.phone} onChange={set("phone")} />
        <TextField fullWidth type="email" label="E-mail (facultatif)" value={fields.email || ""} onChange={set("email")} />
        <TextField fullWidth label="Organisation (facultatif)" value={fields.organization || ""} onChange={set("organization")} />
      </Stack>
    )
  }

  if (type === "email") {
    return (
      <Stack spacing={2}>
        <TextField autoFocus fullWidth required type="email" label="Destinataire" value={fields.to} onChange={set("to")} />
        <TextField fullWidth label="Objet (facultatif)" value={fields.subject || ""} onChange={set("subject")} />
        <TextField fullWidth multiline minRows={3} label="Message (facultatif)" value={fields.body || ""} onChange={set("body")} />
      </Stack>
    )
  }

  return (
    <TextField autoFocus fullWidth required type="tel" label="Numéro de téléphone" value={fields.phone} onChange={set("phone")} />
  )
}

function Feature({ icon, title, description }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ color: "primary.main", display: "grid", placeItems: "center", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
    </Stack>
  )
}

export default function App() {
  const [view, setView] = useState("create")
  const [type, setType] = useState("url")
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [name, setName] = useState("")
  const [foreground, setForeground] = useState("#10121b")
  const [background, setBackground] = useState("#ffffff")
  const [payload, setPayload] = useState("")
  const [preview, setPreview] = useState("")
  const [generating, setGenerating] = useState(false)
  const [formError, setFormError] = useState("")
  const [notice, setNotice] = useState("")
  const [savedState, setSavedState] = useState(readSavedCodes)
  const selectedType = useMemo(() => QR_TYPES.find((item) => item.id === type), [type])

  useEffect(() => {
    let active = true
    setPreview("")
    setGenerating(false)
    try {
      const nextPayload = buildQrPayload(type, fields)
      setFormError("")
      setPayload(nextPayload)
      setGenerating(true)
      QRCode.toDataURL(nextPayload, {
        width: 360,
        margin: 3,
        errorCorrectionLevel: "Q",
        color: { dark: foreground, light: background },
      }).then((dataUrl) => {
        if (active) {
          setPreview(dataUrl)
          setGenerating(false)
        }
      }).catch(() => {
        if (active) {
          setPreview("")
          setFormError("Ce contenu est trop long ou ne peut pas être encodé en QR code.")
          setGenerating(false)
        }
      })
    } catch (error) {
      setPayload("")
      setPreview("")
      const hasInput = Object.entries(fields).some(([key, value]) => key !== "security" && String(value || "").trim())
      setFormError(hasInput ? error.message : "")
      setGenerating(false)
    }
    return () => { active = false }
  }, [type, fields, foreground, background])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState.items))
    } catch {
      setSavedState((current) => ({
        ...current,
        error: "Le navigateur ne permet pas de conserver vos QR codes. Vous pouvez toujours les télécharger.",
      }))
    }
  }, [savedState.items])

  const updateFields = (updater) => setFields(updater)

  const startNew = () => {
    setType("url")
    setFields(INITIAL_FIELDS)
    setName("")
    setView("create")
  }

  const saveCode = () => {
    if (!preview || !payload) return
    const label = name.trim() || selectedType.label
    const code = {
      id: crypto.randomUUID(),
      name: label,
      type,
      typeLabel: selectedType.label,
      payload,
      image: preview,
      foreground,
      background,
      createdAt: new Date().toISOString(),
    }
    setSavedState((current) => ({ ...current, items: [code, ...current.items], error: "" }))
    setNotice("Votre QR code est enregistré dans ce navigateur.")
    setView("saved")
  }

  const removeCode = (id) => {
    setSavedState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }))
  }

  const downloadPng = (code = null) => {
    const item = code || { name: name || selectedType.label, image: preview }
    if (item.image) {
      const anchor = document.createElement("a")
      anchor.href = item.image
      anchor.download = filenameFor(item.name, "png")
      anchor.click()
      setNotice("Votre QR code PNG est prêt.")
    }
  }

  const downloadSvg = async (code = null) => {
    const item = code || { name: name || selectedType.label, payload, foreground, background }
    if (!item.payload) return
    try {
      const svg = await createQrSvg(item.payload, { foreground: item.foreground, background: item.background })
      downloadFile(filenameFor(item.name, "svg"), svg, "image/svg+xml;charset=utf-8")
      setNotice("Votre QR code SVG est prêt.")
    } catch {
      setNotice("Le fichier SVG n’a pas pu être créé. Réessayez.")
    }
  }

  const scrollToGenerator = () => {
    setView("create")
    document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", overflowX: "hidden", background: "radial-gradient(ellipse at 50% -18%, rgba(79,255,219,0.12), transparent 50%)" }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ bgcolor: "rgba(13,13,26,0.88)", borderBottom: 1, borderColor: "divider", backdropFilter: "blur(14px)" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 68, justifyContent: "space-between", gap: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", color: "primary.main", borderRadius: 2, bgcolor: "rgba(79,255,219,0.1)" }}>
                <QrCode2RoundedIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #4fffdb, #a78bfa)", backgroundClip: "text", color: "transparent" }}>
                MultiCode
              </Typography>
              <Chip size="small" label="Démo gratuite" color="primary" variant="outlined" sx={{ display: { xs: "none", sm: "inline-flex" } }} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button color="inherit" onClick={() => setView("create")}>Créer un QR</Button>
              <Button color="inherit" onClick={() => setView("saved")}>Mes QR ({savedState.items.length})</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 9 }, pb: 8 }}>
        <Stack spacing={2} alignItems="center" textAlign="center" sx={{ maxWidth: 820, mx: "auto", mb: { xs: 5, md: 7 } }}>
          <Chip icon={<LockOpenRoundedIcon />} label="Gratuit · sans compte · directement dans votre navigateur" color="primary" variant="outlined" />
          <Typography variant="h1" sx={{ fontSize: { xs: "clamp(2.5rem, 11vw, 3.6rem)", md: "4.5rem" }, lineHeight: 1.05 }}>
            Un QR code utile.
            <Box component="span" sx={{ display: "block", background: "linear-gradient(90deg, #4fffdb, #a78bfa)", backgroundClip: "text", color: "transparent" }}>
              Créé en quelques secondes.
            </Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.15rem" } }}>
            Créez un vrai QR code statique pour votre site, votre Wi-Fi ou vos coordonnées. Personnalisez-le, téléchargez-le et utilisez-le librement.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1, width: { xs: "100%", sm: "auto" } }}>
            <Button size="large" variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={scrollToGenerator}>
              Créer mon QR code
            </Button>
            <Button size="large" variant="outlined" onClick={() => setView("saved")}>
              Voir mes QR codes
            </Button>
          </Stack>
        </Stack>

        <Box id="generator" sx={{ scrollMarginTop: 88 }}>
          {view === "create" ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" }, gap: 2.5, alignItems: "start" }}>
              <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.paper" }}>
                <CardContent sx={{ p: { xs: 2.25, sm: 3.5 } }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h2" component="h2" sx={{ fontSize: { xs: "1.45rem", sm: "1.7rem" } }}>Créez votre QR code</Typography>
                      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>Choisissez le contenu. L’aperçu se met à jour automatiquement.</Typography>
                    </Box>

                    <FormControl fullWidth>
                      <InputLabel id="qr-type-label">Contenu du QR code</InputLabel>
                      <Select
                        labelId="qr-type-label"
                        label="Contenu du QR code"
                        value={type}
                        onChange={(event) => { setType(event.target.value); setFields(INITIAL_FIELDS) }}
                      >
                        {QR_TYPES.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
                      </Select>
                    </FormControl>

                    <TypeFields type={type} fields={fields} onChange={updateFields} />

                    <Divider />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField fullWidth label="Nom (facultatif)" placeholder="Ex. Menu du restaurant" value={name} onChange={(event) => setName(event.target.value)} />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField label="QR" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} sx={{ width: 112 }} inputProps={{ "aria-label": "Couleur du QR code" }} />
                        <TextField label="Fond" type="color" value={background} onChange={(event) => setBackground(event.target.value)} sx={{ width: 112 }} inputProps={{ "aria-label": "Couleur de fond" }} />
                      </Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Pour une lecture fiable, gardez un contraste marqué entre le QR code et son fond.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.paper" }}>
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="h6" component="h2">Aperçu en direct</Typography>
                    <Box sx={{ mt: 2, mx: "auto", width: 252, height: 252, maxWidth: "100%", display: "grid", placeItems: "center", borderRadius: 3, bgcolor: "#fff", p: 1.5 }}>
                      {preview
                        ? <Box component="img" src={preview} alt={`Aperçu du QR code ${selectedType.label}`} sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
                        : <Stack spacing={1} alignItems="center" sx={{ color: "#677080" }}><QrCode2RoundedIcon sx={{ fontSize: 50 }} /><Typography variant="body2" textAlign="center">Renseignez le contenu pour générer un aperçu.</Typography></Stack>}
                    </Box>
                    {formError && <Alert severity="info" sx={{ mt: 2, textAlign: "left" }}>{formError}</Alert>}
                    <Stack spacing={1.25} sx={{ mt: 2.5 }}>
                      <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} disabled={!preview || generating} onClick={saveCode}>Enregistrer mon QR</Button>
                      <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={!preview} onClick={() => downloadPng()}>PNG</Button>
                        <Button fullWidth variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={!preview} onClick={() => downloadSvg()}>SVG</Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
                <Alert severity="info" icon={<LockOpenRoundedIcon />}>
                  Votre contenu reste dans ce navigateur. Aucun compte ni serveur n’est utilisé.
                </Alert>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5}>
                <Box>
                  <Typography variant="h2" component="h2" sx={{ fontSize: { xs: "1.6rem", sm: "2rem" } }}>Mes QR codes</Typography>
                  <Typography color="text.secondary">Enregistrés uniquement dans ce navigateur.</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={startNew}>Créer un QR code</Button>
              </Stack>
              {savedState.error && <Alert severity="warning">{savedState.error}</Alert>}
              {savedState.items.length === 0 ? (
                <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.paper" }}>
                  <CardContent sx={{ py: 6, textAlign: "center" }}>
                    <QrCode2RoundedIcon color="primary" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>Aucun QR code enregistré</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Créez un code et retrouvez-le ici sur cet appareil.</Typography>
                    <Button variant="contained" onClick={startNew}>Créer mon premier QR</Button>
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                  {savedState.items.map((code) => (
                    <Card key={code.id} variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.paper" }}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box component="img" src={code.image} alt={`QR code ${code.name}`} sx={{ width: 96, height: 96, p: 0.5, bgcolor: "#fff", borderRadius: 1.5 }} />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={750} noWrap>{code.name}</Typography>
                            <Chip size="small" label={code.typeLabel} sx={{ mt: 0.75 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                              {new Date(code.createdAt).toLocaleDateString("fr-FR")}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {code.payload}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                          <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => downloadPng(code)}>PNG</Button>
                          <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => downloadSvg(code)}>SVG</Button>
                          <IconButton size="small" aria-label={`Supprimer ${code.name}`} onClick={() => removeCode(code.id)} sx={{ ml: "auto" }}>
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </Box>

        <Box sx={{ mt: { xs: 8, md: 10 } }}>
          <Stack spacing={1} textAlign="center" sx={{ mb: 4 }}>
            <Typography variant="h2" component="h2" sx={{ fontSize: { xs: "1.7rem", md: "2.25rem" } }}>Simple, transparent, vraiment gratuit.</Typography>
            <Typography color="text.secondary">Des QR codes utiles, sans inscription et sans mauvaise surprise.</Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>
            <Feature icon={<DevicesRoundedIcon />} title="Généré ici, chez vous" description="Le QR est construit dans votre navigateur. Vos données ne sont pas envoyées à un serveur." />
            <Feature icon={<DownloadRoundedIcon />} title="PNG et SVG" description="Téléchargez une image prête à partager ou un SVG net à toutes les tailles." />
            <Feature icon={<AutoAwesomeRoundedIcon />} title="À vous de l’utiliser" description="Pas de compte, pas de limite d’essai, pas de paiement. Vos codes restent accessibles sur cet appareil." />
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 5 }}>
          Cette démo crée de vrais QR codes statiques : leur contenu ne peut pas être modifié après impression. Les QR dynamiques et les statistiques nécessitent un service en ligne et ne sont pas simulés ici.
        </Alert>
      </Container>

      <Box component="footer" sx={{ py: 3, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} ZCOORE · MultiCode</Typography>
              <Button component="a" href="mailto:contact@multicode.fr" size="small" color="inherit" sx={{ p: 0, minHeight: 32 }}>
                contact@multicode.fr
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">Démo gratuite · données conservées sur cet appareil</Typography>
          </Stack>
        </Container>
      </Box>

      <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice("")} message={notice} />
    </Box>
  )
}
