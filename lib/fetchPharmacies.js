import Papa from 'papaparse';

export async function fetchPharmacies() {
  const res = await fetch('/data/pharmacies.csv');
  const csv  = await res.text();
  const { data } = Papa.parse(csv, { header: true });

  return data.map(d => ({
    name:    d.name,
    address: d.address,
    lat:     parseFloat(d.lat) || null,
    lng:     parseFloat(d.lng) || null,
    tel:     d.tel || d['tel '] || d[' TEL'] || d['\uFEFFtel'] || '', // BOMやスペース対応
    fax:     d.fax,
    monday:    d.monday,
    tuesday:   d.tuesday,
    wednesday: d.wednesday,
    thursday:  d.thursday,
    friday:    d.friday,
    saturday:  d.saturday,
    sunday:    d.sunday,
  }));
}
