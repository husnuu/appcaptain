export type Country = {
  id: string
  label: string
}

export type Firm = {
  id: string
  slug: string
  name: string
  countryId: string
  countryLabel: string
  city: string
  logoText: string
  logoTone: 'blue' | 'teal' | 'navy' | 'gold' | 'coral'
  summary: string
  luggagePolicy: string
  routes: Array<{ from: string; to: string }>
  discounts: string[]
  fleetHighlights: string[]
}

export const COUNTRIES: Country[] = [
  { id: 'tr', label: 'Türkiye' },
  { id: 'gr', label: 'Yunanistan' },
  { id: 'it', label: 'İtalya' },
  { id: 'hr', label: 'Hırvatistan' },
  { id: 'es', label: 'İspanya' },
  { id: 'fr', label: 'Fransa' },
  { id: 'me', label: 'Karadağ' },
  { id: 'ae', label: 'BAE' },
]

export const FIRMS: Firm[] = [
  {
    id: 'f1',
    slug: 'blue-horizon-charter',
    name: 'Blue Horizon Charter',
    countryId: 'tr',
    countryLabel: 'Türkiye',
    city: 'Bodrum',
    logoText: 'BHC',
    logoTone: 'blue',
    summary: 'Blue Horizon Charter ile gulet, motoryat ve yelkenli seceneklerini tek panelden karsilastirabilirsiniz.',
    luggagePolicy: 'Standart rezervasyonlarda kisi basi bir orta boy valiz ve bir kisisel canta kabul edilir.',
    routes: [
      { from: 'Bodrum', to: 'Datca' },
      { from: 'Marmaris', to: 'Bozburun' },
    ],
    discounts: ['Erken rezervasyonda %10', '7 gece ve uzeri kiralamada ekstra %5'],
    fleetHighlights: ['12-24 metre motor yatlar', 'Kaptanli/kapdansiz secenekler', 'Aile dostu tekne profili'],
  },
  {
    id: 'f2',
    slug: 'mavi-rota-yachting',
    name: 'Mavi Rota Yachting',
    countryId: 'tr',
    countryLabel: 'Türkiye',
    city: 'Bodrum',
    logoText: 'MR',
    logoTone: 'teal',
    summary: 'Mavi Rota Yachting, ozellikle kisa sureli hafta sonu charter paketlerinde hizli onay sureci sunar.',
    luggagePolicy: 'Ek spor ekipmanlari (paddle, dalis cantasi) uygun tekne tiplerinde onceden bildirimle kabul edilir.',
    routes: [
      { from: 'Gocek', to: '12 Adalar' },
      { from: 'Fethiye', to: 'Oludeniz' },
    ],
    discounts: ['Hafta ici cikislarda ozel fiyat', 'Tekrar rezervasyonda sadakat indirimi'],
    fleetHighlights: ['Yeni model katamaranlar', 'Su oyuncaklari dahil paketler', 'Gocek cikisli rota uzmanligi'],
  },
  {
    id: 'f3',
    slug: 'aegean-sky-boats',
    name: 'Aegean Sky Boats',
    countryId: 'gr',
    countryLabel: 'Yunanistan',
    city: 'Mykonos',
    logoText: 'AS',
    logoTone: 'navy',
    summary: 'Aegean Sky Boats, Kiklad adalari arasinda premium servis seviyesi ve esnek check-in secenekleriyle one cikar.',
    luggagePolicy: 'Yolculuk uzunluguna gore bagaj limitleri degisir; online rezervasyonda tekne bazli detaylar gosterilir.',
    routes: [
      { from: 'Mykonos', to: 'Naxos' },
      { from: 'Santorini', to: 'Ios' },
    ],
    discounts: ['Donus rotasinda eslesmeli indirim', 'Grup rezervasyonlarinda ozel teklif'],
    fleetHighlights: ['Premium skipper havuzu', 'Hizli check-in belgeleri', 'Kiklad odakli rota paketleri'],
  },
  {
    id: 'f4',
    slug: 'cyclades-charter-co',
    name: 'Cyclades Charter Co.',
    countryId: 'gr',
    countryLabel: 'Yunanistan',
    city: 'Paros',
    logoText: 'CC',
    logoTone: 'blue',
    summary: 'Cyclades Charter Co., sezonsal etkinliklere uygun ozel gezi rotalariyla one cikan bir operatordur.',
    luggagePolicy: 'Kabin sayisina gore bagaj kapasitesi degisir; fazla bagaj icin destek ekibi on onay verir.',
    routes: [
      { from: 'Paros', to: 'Milos' },
      { from: 'Athens', to: 'Hydra' },
    ],
    discounts: ['Erken rezervasyonda ucretsiz tarih degisikligi', 'Kampanya donemlerinde yakit paketi'],
    fleetHighlights: ['Event charter secenekleri', 'Genis rota agi', 'Donemsel fiyat kampanyalari'],
  },
]

export function getFirmBySlug(slug: string): Firm | undefined {
  return FIRMS.find(firm => firm.slug === slug)
}
