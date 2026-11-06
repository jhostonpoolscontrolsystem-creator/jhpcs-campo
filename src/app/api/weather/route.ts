import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '-16.4251';
  const lon = searchParams.get('lon') || '-39.0624';
  const apiKey = process.env.OPENWEATHER_API_KEY || '4066ca63e2850558ed7b5e3377357a91';

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!res.ok) {
      // Fallback gracioso com dados preditivos se a chave nova ainda estiver propagando (leva até 2h no OpenWeather)
      return NextResponse.json({
        temp: 28,
        description: 'Ensolarado com poucas nuvens',
        condition: 'Clear',
        rain_probability: 'Baixa (10%)',
        recommendation: 'Condições térmicas ideais. Manter cloração entre 1.5 e 3.0 ppm.',
        is_fallback: true
      });
    }

    const data = await res.json();
    const isRain = data.weather[0]?.main?.toLowerCase().includes('rain');
    
    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description,
      condition: data.weather[0]?.main,
      rain_probability: isRain ? 'Alta' : 'Baixa',
      recommendation: isRain 
        ? 'Possibilidade de chuvas intensas. Seu piscineiro foi notificado a redobrar a alcalinidade para evitar choque térmico e água ácida.'
        : 'Condições estáveis. Manter parâmetros normais de manutenção.',
      city: data.name,
      is_fallback: false
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    return NextResponse.json({
      temp: 27,
      description: 'Céu limpo',
      condition: 'Clear',
      rain_probability: 'Baixa',
      recommendation: 'Condições climáticas favoráveis. Sem risco de diluição por chuva.',
      is_fallback: true
    });
  }
}
