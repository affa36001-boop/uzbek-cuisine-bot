export const branches = [
  {
    id: 'main',
    address: 'ул. Амира Тимура, 15',
    lat: 41.3111,
    lng: 69.2797,
  },
  {
    id: 'mirzo',
    address: 'ул. Мирзо Улугбека, 42',
    lat: 41.3400,
    lng: 69.3350,
  },
];

export function getBranchById(id) {
  return branches.find(b => b.id === id) || null;
}
