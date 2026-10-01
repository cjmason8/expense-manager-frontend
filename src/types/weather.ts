export interface WeatherForecastDay {
  date: string
  minTemp: number | null
  maxTemp: number | null
  precis: string | null
  iconCode: number | null
  rainChance: string | null
  rainRange: string | null
  forecastText: string | null
  fireDanger: string | null
  uvAlert: string | null
}

export interface WeatherForecast {
  location: string
  detailArea: string | null
  issuedAt: string | null
  days: WeatherForecastDay[]
}
