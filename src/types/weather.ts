export interface WeatherForecastDay {
  date: string
  minTemp: number | null
  maxTemp: number | null
  precis: string | null
  iconCode: number | null
  rainChance: string | null
  rainRange: string | null
}

export interface WeatherForecast {
  location: string
  issuedAt: string | null
  days: WeatherForecastDay[]
}
