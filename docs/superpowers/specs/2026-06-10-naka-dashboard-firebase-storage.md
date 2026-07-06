# Naka Dashboard — Firebase Storage Integration

**Date:** 2026-06-10  
**Status:** Approved

## Goal

Allow the dashboard at `https://naka-outlet.web.app` to show weekly sales data that persists for all visitors. An admin uploads 3 Excel files once per week; the public URL automatically reflects the new data.

## Architecture

```
Firebase Hosting (naka-outlet.web.app)
  └── index.html  (dashboard)
        │  on load: fetch JSON from Storage
        │  on upload: write JSON to Storage (auth required)
        ▼
Firebase Storage
  └── data/naka_data.json   (public read, auth write)

Firebase Auth
  └── Google provider (only whitelisted emails can write)
```

## Weekly Update Flow

1. Admin opens `naka-outlet.web.app`
2. Clicks "Actualizar datos" button in header
3. Google sign-in popup appears (only authorized emails pass)
4. Upload panel shows 3 file selectors: Naka Outdoors · Aonijie · Naturehike
5. Admin selects the 3 Excel exports and clicks "Procesar y publicar"
6. Browser processes files with SheetJS, uploads JSON to Storage
7. Dashboard reloads data — everyone sees updated numbers

## Data Processing Rules

**Source files:** 3 Excel exports, one per brand  
**Headers:** row 3; data starts row 4  
**Exclude states (col E):** `CANCELADO`, `FALTANTE DE STOCK`  
**Include states:** `FINALIZADO`, `ENVIADO`, `EN PREPARACIÓN`, `LISTO PARA RETIRAR`, `LISTO PARA DESPACHAR`, `PENDIENTE`, `PEDIDOS SALON`

**Order deduplication:** group by col B (ORDEN); if same order number appears multiple times, count as one pedido (sum amounts)

**Channel detection:**
| Source file | Col M value | Channel |
|-------------|-------------|---------|
| Aonijie | any | MercadoLibre |
| Naturehike | any | MercadoLibre |
| Naka | RETIRO EN LOCAL | Local |
| Naka | ENVIO | Web |

**Ticket promedio:** sum(col P) / count(unique orders in col B)  
**Método de pago:** col R value `ACONVENIR` → display as "Transferencia"

**Output JSON shape:**
```json
{
  "updatedAt": "2026-06-10T10:32:00.000Z",
  "updatedBy": "user@email.com",
  "weekLabel": "09/06 - 15/06/26",
  "sources": ["naka", "aonijie", "naturehike"],
  "orders": [
    {
      "f": "2026-06-09",
      "o": 173164,
      "e": "FINALIZADO",
      "m": 416190,
      "c": "Web",
      "pr": "CORDOBA",
      "fp": "TARJETA",
      "pg": "NAVE",
      "brand": "naka"
    }
  ]
}
```

## UI Components

### Header badge
- Shows: `Actualizado: mar 10 jun · 10:32`
- Green when data is ≤7 days old
- Yellow + warning icon when data is >7 days old
- Red + "Sin datos" when no JSON found in Storage

### "Actualizar datos" button
- Visible in header at all times
- Opens Google sign-in if not authenticated
- After auth: shows upload panel as a modal overlay

### Upload panel (modal)
- 3 drop zones / file pickers labeled by brand
- Progress indicator while processing
- "Procesar y publicar" button (disabled until all 3 files selected)
- Success message with timestamp after upload

## Firebase Configuration

**Storage path:** `data/naka_data.json`  
**Storage rules:**
```
match /data/naka_data.json {
  allow read;
  allow write: if request.auth != null;
}
```

**Auth:** Google provider, email restriction enforced in Storage rules or app logic  
**CORS:** allow GET from all origins on Storage bucket

## Files Modified

- `naka-firebase-hosting/public/index.html` — main dashboard
- `naka-firebase-hosting/firebase.json` — add Storage emulator config if needed
- `naka-firebase-hosting/storage.rules` — new file
- `naka-firebase-hosting/.firebaserc` — already configured

## Out of Scope

- Historical data across multiple weeks (only latest upload is stored)
- Mobile-optimized upload UI
- Automatic weekly reminders
