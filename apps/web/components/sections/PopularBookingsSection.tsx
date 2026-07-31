'use client'

import Link from 'next/link'
import { useState } from 'react'

const TABS = [
  {
    id: 'boat-type',
    label: 'Tekne Tipi',
    items: [
      'Katamaran', 'Gulet', 'Yelkenli', 'Motor Yat',
      'Sürat Teknesi', 'Lüks Yat', 'Parti Teknesi', 'Balıkçı Teknesi',
      'Dalış Teknesi', 'Açık Deniz Yatı', 'Kıç Kokpit Yelkenli', 'Kamarota Yat',
    ],
  },
  {
    id: 'experience-type',
    label: 'Deneyim Tipi',
    items: [
      'Dalış Kursu', 'Yoga Workshop', 'Gün Batımı Turu', 'Balıkçılık Dersi',
      'Fotoğraf Turu', 'Seramik Workshop', 'Şef ile Yemek', 'Adalar Turu',
      'Snorkeling', 'Kano & Kayak', 'Sörf Dersi', 'Meditasyon Retreati',
    ],
  },
  {
    id: 'destinations',
    label: 'Popüler Destinasyonlar',
    items: [
      'Bodrum', 'Marmaris', 'Göcek', 'Çeşme',
      'Kaş', 'Fethiye', 'Kuşadası', 'Datça',
      'Antalya', 'İzmir', 'Didim', 'Ayvalık',
      'Gökçeada', 'Bozcaada', 'Marmara Adası', 'Bandırma',
    ],
  },
  {
    id: 'charter-type',
    label: 'Kiralama Türü',
    items: [
      'Günlük Kiralama', 'Haftalık Kiralama', 'Kaptan Dahil Kiralama', 'Kuru Kiralama',
      'Mavi Yolculuk', 'Tekne Tatili', 'Balıkçı Turu', 'Özel Charter',
      'Grup Kiralama', 'Düğün Teknesi', 'Kurumsal Charter', 'Aile Tatili',
    ],
  },
  {
    id: 'by-location',
    label: 'Konuma Göre',
    items: [
      'Bodrum Tekneleri', 'Marmaris Tekneleri', 'Göcek Tekneleri', 'Çeşme Tekneleri',
      'Kaş Tekneleri', 'Fethiye Tekneleri', 'Kuşadası Tekneleri', 'Datça Tekneleri',
      'Antalya Tekneleri', 'İzmir Tekneleri', 'Didim Tekneleri', 'Ayvalık Tekneleri',
    ],
  },
]

export default function PopularBookingsSection() {
  const [activeTab, setActiveTab] = useState('boat-type')
  const current = TABS.find(t => t.id === activeTab)!

  return (
    <section className="pop-bookings-section" aria-labelledby="pop-bookings-heading">
      <div className="pop-bookings-inner">

        <header className="browse-head pop-bookings-head">
          <h2 id="pop-bookings-heading" className="browse-title">
            Popüler Aramalar
          </h2>
        </header>

        {/* Tab pills */}
        <div className="pop-bookings-tabs" role="tablist" aria-label="Arama kategorileri">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`pop-bookings-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Links grid */}
        <div className="pop-bookings-grid" role="tabpanel">
          {current.items.map(item => (
            <Link
              key={item}
              href="/listing"
              className="pop-bookings-link"
            >
              {item}
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
