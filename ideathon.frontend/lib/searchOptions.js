export function filterOptions(options, query) {
  const normalize = value => value.trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');
  const search = normalize(query);
  return options.filter(option => normalize(option).includes(search));
}
