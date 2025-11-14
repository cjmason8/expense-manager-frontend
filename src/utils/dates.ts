export function parseDate(dateString: string) {
  if (!dateString || dateString === '')
    return null

  const [day, month, year] = dateString.split('-')

  return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
}
